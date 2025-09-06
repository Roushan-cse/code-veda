import{useState,useEffect,useRef} from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function App(){
const [isAuthenticated,setIsAuthenticated]=useState(false);
const[conversation,setConversation]=useState([]);

useEffect(() => {
    const token = localStorage.getItem("token");
	    if (token) setIsAuthenticated(true);
  }, []);

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={() => setIsAuthenticated(true)} />;
  }	

return (
  <div className="flex h-screen">
    <div className="fixed left-0 top-0 h-screen w-80 bg-gray-100 overflow-y-auto z-10">
      <ProfileSidebar />
    </div>
    <div className="fixed left-80 top-0 right-0 h-screen flex flex-col">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Dashboard with reduced height */}
        <div className="h-80 flex items-center justify-center bg-white border-b">
          <Dashboard/>
        </div>
        {/* Message section takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <MessageSection conversation={conversation}/>
        </div>
      </div>
      {/* Fixed chatbox at bottom */}
      <div className="h-16 bg-white border-t flex-shrink-0">
        <Chatbox conversation={conversation} setConversation={setConversation} />
      </div>
    </div>
  </div>
);	

}

function AuthPage({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await axios.post("http://localhost:3000/signup", {
          username,
          email,
          password,
        });
        alert("Signup successful! Please login.");
        setIsSignup(false);
        setUsername("");
        setEmail("");
        setPassword("");
      } else {
const res = await axios.post("http://localhost:3000/login", {
          email,
          password,
        });
        localStorage.setItem("token", res.data.token);
        onAuthSuccess();
      }
    } catch (err) {
      setError("Failed: " + (err.response?.data?.message || err.message));
      setUsername("");
      setEmail("");
      setPassword("");
    }
  };	
return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold">{isSignup ? "Sign Up" : "Login"}</h2>
        {isSignup && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        )}	
<input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          {isSignup ? "Sign Up" : "Login"}
        </button>
	<p
          onClick={() => setIsSignup(!isSignup)}
          className="text-sm text-blue-600 cursor-pointer text-center"
        >
          {isSignup ? "Already have an account? Login" : "No account? Sign Up"}
        </p>
      </form>
    </div>
  );
}

function ProfileSidebar() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">Profile Sidebar</h2>
      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
      >
        Logout
      </button>
    </div>
  );
}


function Dashboard({ type = "stats" }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token"); 
    if (type === "stats" && token) {
      setLoading(true);
      axios
        .get("http://localhost:3000/dashboard", {
          params: { type: "stats" },
          headers: { Authorization: Bearer ${token} }, 
        })
        .then((res) => {
          setStats(res.data.stats);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to fetch stats");
          setLoading(false);
        });
    }
  }, [type]);

  if (loading) return <div>Loading stats...</div>;
  if (error) return <div>{error}</div>;
  if (!stats) return <div>No stats available</div>;

  const chartData = [
    { name: "Average Streak", value: stats.avg_days },
    { name: "Max Streak", value: stats.max_days },
    { name: "Min Streak", value: stats.min_days },
  ];

  return (
    <div className="w-full p-4 space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-blue-500 text-white rounded shadow-md">
          <h3 className="text-sm font-medium">Total Profiles</h3>
          <p className="text-xl font-bold">{stats.total_profiles}</p>
        </div>
        <div className="p-3 bg-green-500 text-white rounded shadow-md">
          <h3 className="text-sm font-medium">Max Streak</h3>
          <p className="text-xl font-bold">{stats.max_days}</p>
        </div>
        <div className="p-3 bg-red-500 text-white rounded shadow-md">
          <h3 className="text-sm font-medium">Min Streak</h3>
          <p className="text-xl font-bold">{stats.min_days}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-3 rounded shadow-md">
        <h3 className="text-lg font-semibold mb-2">Streak Stats</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MessageSection({ conversation }) {

 const messagesEndRef = useRef(null);

  // Scroll to bottom whenever conversation changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  return (
    <div className="p-4 w-full h-full overflow-y-auto bg-gray-50 rounded shadow space-y-2">
      {conversation.length === 0 ? (
        <p className="text-gray-400 text-center">No messages yet.</p>
      ) : (
        conversation.map((msg, idx) => (
          <div
            key={idx}
            className={msg.sender === "user" ? "text-right" : "text-left"}
          >
            <span
              className={`inline-block p-2 rounded ${
                msg.sender === "user" ? "bg-blue-200" : "bg-gray-200"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

function Chatbox({ conversation, setConversation }) {
  const [message, setMessage] = useState("");

  const handleSend = async (msg) => {
    // Add user's message
    setConversation((prev) => [...prev, { sender: "user", text: msg }]);

    try {
      const token = localStorage.getItem("token");
      const payload = { session_id: token, message: msg };
      const res = await axios.post("http://192.168.1.109:8000/chat", payload);
      console.log(payload);	    

      setConversation((prev) => [...prev, { sender: "bot", text: res.data }]);
    } catch (error) {
      console.log("Error Sending Message:", error);
      setConversation((prev) => [
        ...prev,
        { sender: "bot", text: "Error sending message" },
      ]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    handleSend(message);
    setMessage(""); // clear input
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2 p-3 h-full items-center">
      <input
        type="text"
        placeholder="Type Your Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 p-2 border rounded"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Send
      </button>
    </form>
  );
}
export default App;