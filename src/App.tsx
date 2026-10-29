/// <reference types="vite/client" />
import { useEffect, useState, type ReactNode, type ChangeEvent } from "react";
import {
  Brain,
  LockKeyhole,
  Settings,
  UserRound,
  Heart,
  ShieldCheck,
  Volume2,
  Globe,
  ArrowLeft,
  Puzzle,
  Mic,
  Target,
  LogOut,
} from "lucide-react";
import "./index.css";
import CognitiveGame, { TowerOfHanoi, VerbalFluencyGame, SlidingNumberPuzzle } from "./games/CognitiveGames";
import VoiceMusic from "./games/VoiceMusic/VoiceMusic";
type Page =
  | "login"
  | "register"
  | "home"
  | "settings"
  | "patient"
  | "activity";
type Activity = {
  title: string;
  description: string;
  image: string;
  icon: ReactNode;
  color: string;
};
type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  image: string;
};
type DailyTask = {
  id: string;
  title: string;
  completed: boolean;
};

type PatientDetails = {
  name: string;
  age: string;
  condition: string;
  phone: string;
  emergencyContact: string;
  notes: string;
};

type CaretakerInfo = {
  name: string;
  relation: string;
  phone: string;
  email: string;
};

type GameResult = {
  id: string;
  game: string;
  score: number;
  correct: number;
  wrong: number;
  attempts: number;
  roundsPlayed: number;
  accuracy: number;
  startedAt: string;
  completedAt: string;
  level?: number;
  challenge?: string;
};

type CaretakerSection =
  | "dashboard"
  | "profile"
  | "family"
  | "tasks"
  | "performance";

const defaultPatientDetails: PatientDetails = {
  name: "MindCare Patient",
  age: "",
  condition: "",
  phone: "",
  emergencyContact: "",
  notes: "",
};

const defaultCaretakerInfo: CaretakerInfo = {
  name: "Caretaker",
  relation: "Family Caregiver",
  phone: "",
  email: "",
};

function loadLocalStorage<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

function recordGameSession(
  result: Omit<GameResult, "id">
) {
  const saved = localStorage.getItem("mindcareGameResults");
  let results: GameResult[] = [];

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        results = parsed.filter(
          (item): item is GameResult =>
            item &&
            typeof item === "object" &&
            typeof item.game === "string" &&
            typeof item.score === "number" &&
            typeof item.correct === "number" &&
            typeof item.wrong === "number" &&
            typeof item.attempts === "number" &&
            typeof item.roundsPlayed === "number" &&
            typeof item.accuracy === "number" &&
            typeof item.startedAt === "string" &&
            typeof item.completedAt === "string"
        );
      }
    } catch {
      results = [];
    }
  }

  results.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...result,
  });

  localStorage.setItem(
    "mindcareGameResults",
    JSON.stringify(results.slice(-200))
  );
}

type TrendPoint = { label: string; value: number | null; sessions: number };

function buildTrend(results: GameResult[], mode: "daily" | "monthly"): TrendPoint[] {
  const now = new Date();
  const buckets: { label: string; key: string; values: number[]; sessions: number }[] = [];
  const count = mode === "daily" ? 7 : 6;
  for (let offset = count - 1; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (mode === "daily") date.setDate(date.getDate() - offset);
    else date.setMonth(date.getMonth() - offset, 1);
    const key = mode === "daily"
      ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      : `${date.getFullYear()}-${date.getMonth()}`;
    buckets.push({
      key,
      label: mode === "daily"
        ? date.toLocaleDateString(undefined, { weekday: "short" })
        : date.toLocaleDateString(undefined, { month: "short" }),
      values: [],
      sessions: 0,
    });
  }
  for (const result of results) {
    const completed = new Date(result.completedAt);
    if (Number.isNaN(completed.getTime())) continue;
    const key = mode === "daily"
      ? `${completed.getFullYear()}-${completed.getMonth()}-${completed.getDate()}`
      : `${completed.getFullYear()}-${completed.getMonth()}`;
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) {
      bucket.values.push(Math.max(0, Math.min(100, result.accuracy)));
      bucket.sessions += 1;
    }
  }
  return buckets.map((bucket) => ({
    label: bucket.label,
    value: bucket.values.length
      ? Math.round(bucket.values.reduce((sum, value) => sum + value, 0) / bucket.values.length)
      : null,
    sessions: bucket.sessions,
  }));
}

function PerformanceTrendChart({ title, subtitle, points }: { title: string; subtitle: string; points: TrendPoint[] }) {
  const width = 680;
  const height = 230;
  const left = 38;
  const right = 18;
  const top = 18;
  const bottom = 42;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const coords = points.map((point, index) => ({
    x: left + (points.length <= 1 ? plotWidth / 2 : index * plotWidth / (points.length - 1)),
    y: point.value === null ? null : top + plotHeight - (point.value / 100) * plotHeight,
    ...point,
  }));
  const pathSegments: string[] = [];
  let segment = "";
  coords.forEach((point) => {
    if (point.sessions === 0 || point.y === null) {
      if (segment) pathSegments.push(segment);
      segment = "";
      return;
    }
    segment += `${segment ? " L" : "M"}${point.x},${point.y}`;
  });
  if (segment) pathSegments.push(segment);
  const hasData = points.some((point) => point.sessions > 0);
  return (
    <section className="settings-card trend-card">
      <div className="trend-card-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><span className="trend-legend"><i /> Average performance</span></div>
      {!hasData ? (
        <div className="trend-empty"><Brain size={25} /><span>Play a game to start building this graph.</span></div>
      ) : (
        <div className="trend-chart-wrap">
          <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title} average game performance chart`}>
            {[0, 25, 50, 75, 100].map((value) => {
              const y = top + plotHeight - (value / 100) * plotHeight;
              return <g key={value}><line x1={left} y1={y} x2={width - right} y2={y} className="trend-gridline" /><text x={left - 8} y={y + 4} textAnchor="end" className="trend-axis-label">{value}</text></g>;
            })}
            <>{pathSegments.map((path, index) => <path key={index} d={path} className="trend-line" />)}</>
            {coords.map((point, index) => <g key={`${point.label}-${index}`}>{point.sessions > 0 && point.y !== null && <circle cx={point.x} cy={point.y} r="4.5" className="trend-dot"><title>{`${point.label}: ${point.value}% average accuracy, ${point.sessions} completed session(s)`}</title></circle>}<text x={point.x} y={height - 17} textAnchor="middle" className="trend-axis-label">{point.label}</text></g>)}
          </svg>
          <div className="trend-session-row" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>{points.map((point, index) => <span key={`${point.label}-${index}`}>{point.sessions} {point.sessions === 1 ? "game" : "games"}</span>)}</div>
        </div>
      )}
    </section>
  );
}

function CaretakerPortal({ onBack }: { onBack: () => void }) {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [caretakerSection, setCaretakerSection] =
    useState<CaretakerSection>("dashboard");
  const [performanceGameFilter, setPerformanceGameFilter] = useState("all");

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() =>
    loadLocalStorage<FamilyMember[]>("mindcareFamilyMembers", [])
  );

  const [patientDetails, setPatientDetails] = useState<PatientDetails>(() =>
    loadLocalStorage<PatientDetails>(
      "mindcarePatientDetails",
      defaultPatientDetails
    )
  );

  const [caretakerInfo, setCaretakerInfo] = useState<CaretakerInfo>(() =>
    loadLocalStorage<CaretakerInfo>("mindcareCaretakerInfo", defaultCaretakerInfo)
  );

  const [tasks, setTasks] = useState<DailyTask[]>(() =>
    loadLocalStorage<DailyTask[]>("mindcareDailyTasks", [])
  );

  const [familyName, setFamilyName] = useState("");
  const [familyRelation, setFamilyRelation] = useState("");
  const [familyImage, setFamilyImage] = useState("");
  const [newTask, setNewTask] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const unlockPortal = () => {
    if (pin === "1234") {
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect PIN. Please try again.");
    }
  };

  const savePatientDetails = () => {
    localStorage.setItem("mindcarePatientDetails", JSON.stringify(patientDetails));
    localStorage.setItem("mindcareCaretakerInfo", JSON.stringify(caretakerInfo));
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 1800);
  };

  const updatePatientField = (
    field: keyof PatientDetails,
    value: string
  ) => {
    setPatientDetails((previous) => ({ ...previous, [field]: value }));
  };

  const updateCaretakerField = (
    field: keyof CaretakerInfo,
    value: string
  ) => {
    setCaretakerInfo((previous) => ({ ...previous, [field]: value }));
  };

  const handleFamilyImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFamilyImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addFamilyMember = () => {
    if (!familyName.trim() || !familyRelation.trim() || !familyImage) {
      alert("Please add a photo, name and relationship.");
      return;
    }
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: familyName.trim(),
      relation: familyRelation.trim(),
      image: familyImage,
    };
    const updatedMembers = [...familyMembers, newMember];
    setFamilyMembers(updatedMembers);
    localStorage.setItem("mindcareFamilyMembers", JSON.stringify(updatedMembers));
    setFamilyName("");
    setFamilyRelation("");
    setFamilyImage("");
  };

  const removeFamilyMember = (id: string) => {
    const updatedMembers = familyMembers.filter((member) => member.id !== id);
    setFamilyMembers(updatedMembers);
    localStorage.setItem("mindcareFamilyMembers", JSON.stringify(updatedMembers));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const updatedTasks = [
      ...tasks,
      { id: Date.now().toString(), title: newTask.trim(), completed: false },
    ];
    setTasks(updatedTasks);
    localStorage.setItem("mindcareDailyTasks", JSON.stringify(updatedTasks));
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem("mindcareDailyTasks", JSON.stringify(updatedTasks));
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem("mindcareDailyTasks", JSON.stringify(updatedTasks));
  };

  const startEditingTask = (task: DailyTask) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const saveEditedTask = () => {
    if (!editingTaskId || !editingTaskTitle.trim()) return;
    const updatedTasks = tasks.map((task) =>
      task.id === editingTaskId
        ? { ...task, title: editingTaskTitle.trim() }
        : task
    );
    setTasks(updatedTasks);
    localStorage.setItem("mindcareDailyTasks", JSON.stringify(updatedTasks));
    setEditingTaskId(null);
    setEditingTaskTitle("");
  };

  const gameResults = loadLocalStorage<GameResult[]>("mindcareGameResults", []);

  // Family Recognition also creates one completed GameResult session.
  // Its raw answer history is kept separately for detailed records,
  // so it must not be counted twice in the overall score.
  const overallScore = gameResults.length
    ? Math.round(gameResults.reduce((sum, result) => sum + Math.max(0, Math.min(100, result.accuracy)), 0) / gameResults.length)
    : 0;
  const activitiesPlayed = gameResults.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const progressLabel =
    overallScore >= 80 ? "Excellent" : overallScore >= 60 ? "Good" : overallScore > 0 ? "Needs Support" : "No Results Yet";
  const availablePerformanceGames = Array.from(new Set(gameResults.map((result) => result.game))).sort((a, b) => a.localeCompare(b));
  const filteredGameResults = performanceGameFilter === "all" ? gameResults : gameResults.filter((result) => result.game === performanceGameFilter);

  if (!unlocked) {
    return (
      <div className="page-container">
        <header className="top-header">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={22} />
            Back
          </button>
          <div className="brand">
            <div className="brand-icon"><Heart size={28} /></div>
            <span>MindCare</span>
          </div>
          <div />
        </header>
        <main className="login-page" style={{ minHeight: "calc(100vh - 82px)" }}>
          <div className="login-card">
            <div className="logo-box"><LockKeyhole size={48} /></div>
            <h1>Caretaker Portal</h1>
            <p className="login-subtitle">Secure access to patient care and progress.</p>
            <div className="input-group">
              <label>4-Digit Caretaker PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                placeholder="Enter 4-digit PIN"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(value);
                  setError("");
                }}
                onKeyDown={(e) => { if (e.key === "Enter") unlockPortal(); }}
              />
            </div>
            {error && <p className="input-error">{error}</p>}
            <button className="primary-button" type="button" onClick={unlockPortal}>
              <LockKeyhole size={19} /> Unlock Caretaker Portal
            </button>
            <p style={{ textAlign: "center", marginTop: 14, color: "#64748b" }}>
              Your PIN keeps patient information private.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const navItems: Array<{ key: CaretakerSection; label: string; icon: ReactNode }> = [
    { key: "dashboard", label: "Dashboard", icon: <Brain size={21} /> },
    { key: "profile", label: "Patient & Caretaker", icon: <UserRound size={21} /> },
    { key: "family", label: "Family Members", icon: <Heart size={21} /> },
    { key: "tasks", label: "Daily Tasks", icon: <Target size={21} /> },
    { key: "performance", label: "Performance", icon: <Puzzle size={21} /> },
  ];

  return (
    <div className="page-container">
      <header className="top-header">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowLeft size={22} /> Back
        </button>
        <div className="brand">
          <div className="brand-icon"><Heart size={28} /></div>
          <span>MindCare Caretaker</span>
        </div>
        <button className="icon-button" type="button" onClick={() => { setPin(""); setUnlocked(false); }} title="Lock portal">
          <LockKeyhole size={22} />
        </button>
      </header>

      <main className="caretaker-content">
        <aside className="caretaker-sidebar">
          <div className="caretaker-sidebar-title">Care Management</div>
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={caretakerSection === item.key ? "caretaker-nav active" : "caretaker-nav"}
              onClick={() => setCaretakerSection(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        <div className="caretaker-main">
          {caretakerSection === "dashboard" && (
            <>
              <div className="caretaker-page-heading">
                <div>
                  <p className="hello-text">Caretaker Dashboard</p>
                  <h1>Hello, {caretakerInfo.name || "Caretaker"} 👋</h1>
                  <p className="settings-subtitle">Here is the latest care and activity summary.</p>
                </div>
                <button className="secondary-button" type="button" onClick={() => setCaretakerSection("profile")}>
                  <UserRound size={19} /> Edit Details
                </button>
              </div>

              <div className="caretaker-info-banner">
                <div className="caretaker-avatar"><UserRound size={32} /></div>
                <div>
                  <strong>{caretakerInfo.name || "Caretaker"}</strong>
                  <span>{caretakerInfo.relation || "Caregiver"}</span>
                  <small>{caretakerInfo.phone || "Phone not added"} {caretakerInfo.email ? `• ${caretakerInfo.email}` : ""}</small>
                </div>
              </div>

              <div className="caretaker-stats">
                <div className="caretaker-stat-card"><Brain size={30} /><strong>{overallScore}%</strong><span>Overall Game Score</span></div>
                <div className="caretaker-stat-card"><Target size={30} /><strong>{completedTasks}/{tasks.length}</strong><span>Tasks Completed</span></div>
                <div className="caretaker-stat-card"><Puzzle size={30} /><strong>{activitiesPlayed}</strong><span>Games Solved</span></div>
              </div>

              <div className="profile-summary-grid">
                <div className="settings-card">
                  <h2>Patient Information</h2>
                  <p><strong>Name:</strong> {patientDetails.name || "Not added"}</p>
                  <p><strong>Age:</strong> {patientDetails.age || "Not added"}</p>
                  <p><strong>Condition:</strong> {patientDetails.condition || "Not added"}</p>
                  <button className="secondary-button" type="button" onClick={() => setCaretakerSection("profile")}>
                    Edit Patient Details
                  </button>
                </div>
                <div className="settings-card">
                  <h2>Care Summary</h2>
                  <p><strong>Family members:</strong> {familyMembers.length}</p>
                  <p><strong>Games recorded:</strong> {activitiesPlayed}</p>
                  <p><strong>Current progress:</strong> {progressLabel}</p>
                  <p><strong>Daily tasks:</strong> {tasks.length}</p>
                </div>
              </div>
            </>
          )}

          {caretakerSection === "profile" && (
            <>
              <div className="caretaker-page-heading">
                <div>
                  <p className="hello-text">Profiles</p>
                  <h1>Patient & Caretaker Information</h1>
                  <p className="settings-subtitle">Update the information whenever the care situation changes.</p>
                </div>
                {profileSaved && <span className="success-message">Saved successfully ✓</span>}
              </div>

              <div className="profile-edit-grid">
                <div className="settings-card">
                  <h2>Patient Details</h2>
                  <div className="input-group"><label>Patient Name</label><input value={patientDetails.name} onChange={(e) => updatePatientField("name", e.target.value)} placeholder="Enter patient name" /></div>
                  <div className="input-group"><label>Age</label><input type="number" value={patientDetails.age} onChange={(e) => updatePatientField("age", e.target.value)} placeholder="Enter age" /></div>
                  <div className="input-group"><label>Condition / Care Needs</label><input value={patientDetails.condition} onChange={(e) => updatePatientField("condition", e.target.value)} placeholder="Example: Memory support" /></div>
                  <div className="input-group"><label>Patient Phone</label><input type="tel" value={patientDetails.phone} onChange={(e) => updatePatientField("phone", e.target.value)} placeholder="Enter phone number" /></div>
                  <div className="input-group"><label>Emergency Contact</label><input value={patientDetails.emergencyContact} onChange={(e) => updatePatientField("emergencyContact", e.target.value)} placeholder="Name and phone" /></div>
                  <div className="input-group"><label>Care Notes</label><textarea value={patientDetails.notes} onChange={(e) => updatePatientField("notes", e.target.value)} placeholder="Add important care notes" rows={4} /></div>
                </div>

                <div className="settings-card">
                  <h2>Caretaker Information</h2>
                  <div className="input-group"><label>Caretaker Name</label><input value={caretakerInfo.name} onChange={(e) => updateCaretakerField("name", e.target.value)} placeholder="Enter caretaker name" /></div>
                  <div className="input-group"><label>Relationship</label><input value={caretakerInfo.relation} onChange={(e) => updateCaretakerField("relation", e.target.value)} placeholder="Example: Daughter" /></div>
                  <div className="input-group"><label>Phone</label><input type="tel" value={caretakerInfo.phone} onChange={(e) => updateCaretakerField("phone", e.target.value)} placeholder="Enter phone number" /></div>
                  <div className="input-group"><label>Email</label><input type="email" value={caretakerInfo.email} onChange={(e) => updateCaretakerField("email", e.target.value)} placeholder="Enter email" /></div>
                  <button className="primary-button" type="button" onClick={savePatientDetails}>
                    <ShieldCheck size={19} /> Save All Details
                  </button>
                </div>
              </div>
            </>
          )}

          {caretakerSection === "family" && (
            <>
              <h1>Family Members</h1>
              <p className="settings-subtitle">These faces are used by the Family Recognition game.</p>
              <div className="settings-card">
                <div className="input-group"><label>Family Member Name</label><input type="text" value={familyName} placeholder="Enter name" onChange={(e) => setFamilyName(e.target.value)} /></div>
                <div className="input-group"><label>Relationship</label><input type="text" value={familyRelation} placeholder="Example: Daughter" onChange={(e) => setFamilyRelation(e.target.value)} /></div>
                <div className="input-group"><label>Photo</label><input type="file" accept="image/*" onChange={handleFamilyImage} /></div>
                {familyImage && <img src={familyImage} alt="Preview" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 16, marginBottom: 15 }} />}
                <button className="primary-button" type="button" onClick={addFamilyMember}>Add Family Member</button>
              </div>
              <div className="family-list">
                {familyMembers.length === 0 ? (
                  <div className="settings-card"><p>No family members added yet.</p></div>
                ) : familyMembers.map((member) => (
                  <div className="family-member-card" key={member.id}>
                    <img src={member.image} alt={member.name} />
                    <div><h3>{member.name}</h3><p>{member.relation}</p></div>
                    <button className="secondary-button" type="button" onClick={() => removeFamilyMember(member.id)}>Remove</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {caretakerSection === "tasks" && (
            <>
              <h1>Daily Tasks</h1>
              <p className="settings-subtitle">Create tasks for the patient. Nothing is added automatically.</p>
              <div className="settings-card">
                <div className="task-create-row">
                  <input value={newTask} placeholder="Example: Complete a memory game" onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTask(); }} />
                  <button className="primary-button" type="button" onClick={addTask}>Add Task</button>
                </div>
              </div>
              <div className="settings-card">
                {tasks.length === 0 ? (
                  <div className="empty-state"><Target size={34} /><h3>No daily tasks yet</h3><p>Create the first task above.</p></div>
                ) : tasks.map((task) => (
                  <div className="task-management-row" key={task.id}>
                    {editingTaskId === task.id ? (
                      <>
                        <input value={editingTaskTitle} onChange={(e) => setEditingTaskTitle(e.target.value)} />
                        <button className="secondary-button" type="button" onClick={saveEditedTask}>Save</button>
                        <button className="icon-button" type="button" onClick={() => setEditingTaskId(null)} title="Cancel">×</button>
                      </>
                    ) : (
                      <>
                        <label className="task-check-label">
                          <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
                          <span style={{ textDecoration: task.completed ? "line-through" : "none" }}>{task.title}</span>
                        </label>
                        <div className="task-actions">
                          <button className="secondary-button" type="button" onClick={() => startEditingTask(task)}>Edit</button>
                          <button className="secondary-button danger-button" type="button" onClick={() => deleteTask(task.id)}>Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {caretakerSection === "performance" && (
            <>
              <div className="caretaker-page-heading">
                <div>
                  <p className="hello-text">Patient Progress</p>
                  <h1>Performance Analysis</h1>
                  <p className="settings-subtitle">Calculated from the patient's completed game results.</p>
                </div>
              </div>
              <div className="caretaker-stats">
                <div className="caretaker-stat-card"><Target size={30} /><strong>{overallScore}%</strong><span>Average Game Performance</span></div>
                <div className="caretaker-stat-card"><Brain size={30} /><strong>{activitiesPlayed}</strong><span>Games / Rounds Recorded</span></div>
                <div className="caretaker-stat-card"><Heart size={30} /><strong>{progressLabel}</strong><span>Progress Level</span></div>
              </div>
              <div className="performance-filter-row">
                <label htmlFor="performance-game-filter">Show performance for</label>
                <select id="performance-game-filter" value={performanceGameFilter} onChange={(event) => setPerformanceGameFilter(event.target.value)}>
                  <option value="all">All games played</option>
                  {availablePerformanceGames.map((game) => <option key={game} value={game}>{game}</option>)}
                </select>
                <span>Only completed sessions are included. Days with no games are shown as no data, not 0%.</span>
              </div>
              <div className="performance-chart-grid">
                <PerformanceTrendChart title="Daily Analysis" subtitle="Average performance and sessions over the last 7 days" points={buildTrend(filteredGameResults, "daily")} />
                <PerformanceTrendChart title="Monthly Analysis" subtitle="Average performance and sessions over the last 6 months" points={buildTrend(filteredGameResults, "monthly")} />
              </div>
              <div className="settings-card">
                <div className="trend-card-heading"><div><h2>Performance by Game</h2><p>Average performance from games the patient has completed.</p></div></div>
                {gameResults.length === 0 ? (
                  <div className="empty-state"><Puzzle size={34} /><h3>No game results yet</h3><p>After the patient completes a game, its accuracy and session count will appear here.</p></div>
                ) : (
                  <div className="game-performance-list">
                    {Array.from(gameResults.reduce((map, result) => {
                      const current = map.get(result.game) ?? { count: 0, total: 0, latest: result.completedAt };
                      current.count += 1;
                      current.total += Math.max(0, Math.min(100, result.accuracy));
                      if (new Date(result.completedAt).getTime() > new Date(current.latest).getTime()) current.latest = result.completedAt;
                      map.set(result.game, current);
                      return map;
                    }, new Map<string, { count: number; total: number; latest: string }>()).entries())
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([game, summary]) => {
                        const average = Math.round(summary.total / summary.count);
                        return <div className="game-performance-row" key={game}>
                          <div className="game-performance-title"><strong>{game}</strong><span>{summary.count} completed {summary.count === 1 ? "session" : "sessions"} · Latest: {new Date(summary.latest).toLocaleDateString()}</span></div>
                          <div className="game-performance-meter" role="img" aria-label={`${game}: ${average}% average performance`}><span style={{ width: `${average}%` }} /></div>
                          <strong className="game-performance-percent">{average}%</strong>
                        </div>;
                      })}
                  </div>
                )}
              </div>
              <div className="settings-card">
                <h2>Recent Game Sessions</h2>
                {gameResults.length === 0 ? (
                  <p>No completed sessions have been recorded yet.</p>
                ) : (
                  <div className="performance-list">
                    {gameResults.slice().reverse().slice(0, 12).map((result, index) => (
                      <div className="performance-row" key={`${result.id}-${index}`}>
                        <div>
                          <strong>{result.game}</strong>
                          <span>{new Date(result.completedAt).toLocaleString()} · {result.roundsPlayed} round(s){result.level ? ` · Level ${result.level}` : ""}{result.challenge ? ` · ${result.challenge}` : ""} · {result.correct}/{result.attempts} correct</span>
                        </div>
                        <strong>{result.accuracy}%</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>("login");
  const [selectedActivity, setSelectedActivity] =
    useState<Activity | null>(null);
  const [showCaretaker, setShowCaretaker] = useState(false);
  const handleLogin = () => {
    setPage("home");
  };
  const openActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setPage("activity");
  };
  // CARETAKER PORTAL
  if (showCaretaker) {
    return (
      <div className="app">
        <CaretakerPortal
          onBack={() => setShowCaretaker(false)}
        />
      </div>
    );
  }
  return (
    <div className="app">
      {page === "login" && (
        <LoginPage
          onLogin={handleLogin}
          onRegister={() => setPage("register")}
        />
      )}
      {page === "register" && (
        <RegisterPage
          onBack={() => setPage("login")}
          onRegistered={() => setPage("login")}
        />
      )}
      {page === "home" && (
        <HomePage
          onSettings={() => setPage("settings")}
          onPatient={() => setPage("patient")}
          onCaretaker={() => setShowCaretaker(true)}
        />
      )}
      {page === "patient" && (
        <PatientPortal
          onBack={() => setPage("home")}
          onActivity={openActivity}
        />
      )}
      {page === "activity" && selectedActivity && (
        <ActivityPage
          activity={selectedActivity}
          onBack={() => setPage("patient")}
        />
      )}
      {page === "settings" && (
        <SettingsPage
          onBack={() => setPage("home")}
          onLogout={() => setPage("login")}
        />
      )}
    </div>
  );
}
/* LOGIN */
function LoginPage({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };
  const login = () => {
    setEmailError("");
    setPasswordError("");
    setLoginError("");
    if (!email.trim()) {
      setEmailError("Please enter your email.");
      return;
    }
    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setPasswordError("Please enter your password.");
      return;
    }
    if (password.length < 6) {
      setPasswordError(
        "Password must be at least 6 characters."
      );
      return;
    }
    const storedUser = localStorage.getItem("mindcareUser");
    if (!storedUser) {
      setLoginError(
        "No account found. Please create an account first."
      );
      return;
    }
    let user: { email: string; password: string };
    try {
      user = JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("mindcareUser");
      setLoginError("Saved account data is invalid. Please create your account again.");
      return;
    }
    if (
      user.email.toLowerCase() !==
      email.trim().toLowerCase()
    ) {
      setEmailError("No account found with this email.");
      return;
    }
    if (user.password !== password) {
      setPasswordError("Incorrect password.");
      return;
    }
    onLogin();
  };
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-box">
          <Brain size={48} />
        </div>
        <h1>Welcome to MindCare</h1>
        <p className="login-subtitle">
          A gentle space for memory, connection & care
        </p>
        {/* EMAIL */}
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
              setLoginError("");
            }}
          />
          {emailError && (
            <p className="input-error">
              {emailError}
            </p>
          )}
        </div>
        {/* PASSWORD */}
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
              setLoginError("");
            }}
          />
          {passwordError && (
            <p className="input-error">
              {passwordError}
            </p>
          )}
        </div>
        {loginError && (
          <p className="login-error">
            {loginError}
          </p>
        )}
        <button
          type="button"
          className="primary-button"
          onClick={() => login()}
        >
          Login
        </button>
        <p className="small-link">
          Forgot password?
        </p>
        <p className="create-account">
          New to MindCare?{" "}
          <button
  type="button"
  className="link-button"
  onClick={() => {
    console.log("Create Account clicked");
    onRegister();
  }}
>
  Create Account
</button>
        </p>
      </div>
    </div>
  );
}
/* REGISTER */
function RegisterPage({
  onBack,
  onRegistered,
}: {
  onBack: () => void;
  onRegistered: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] =
    useState("");
  const [confirmError, setConfirmError] =
    useState("");
  const [success, setSuccess] = useState("");
  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };
  const register = () => {
    setEmailError("");
    setPasswordError("");
    setConfirmError("");
    setSuccess("");
    if (!email.trim()) {
      setEmailError("Please enter your email.");
      return;
    }
    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setPasswordError("Please create a password.");
      return;
    }
    if (password.length < 6) {
      setPasswordError(
        "Password must be at least 6 characters."
      );
      return;
    }
    if (!confirmPassword) {
      setConfirmError(
        "Please confirm your password."
      );
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError(
        "Passwords do not match."
      );
      return;
    }
    const existingUser =
      localStorage.getItem("mindcareUser");
    if (existingUser) {
      let user: { email: string; password: string };
      try {
        user = JSON.parse(existingUser);
      } catch {
        localStorage.removeItem("mindcareUser");
        user = { email: "", password: "" };
      }
      if (
        user.email.toLowerCase() ===
        email.trim().toLowerCase()
      ) {
        setEmailError(
          "An account with this email already exists."
        );
        return;
      }
    }
    const newUser = {
      email: email.trim(),
      password: password,
    };
    localStorage.setItem(
      "mindcareUser",
      JSON.stringify(newUser)
    );
    setSuccess(
      "Account created successfully!"
    );
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      onRegistered();
    }, 1200);
  };
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-box">
          <Brain size={48} />
        </div>
        <h1>Create Account</h1>
        <p className="login-subtitle">
          Create your MindCare account
        </p>
        {/* EMAIL */}
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
          />
          {emailError && (
            <p className="input-error">
              {emailError}
            </p>
          )}
        </div>
        {/* PASSWORD */}
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
          />
          {passwordError && (
            <p className="input-error">
              {passwordError}
            </p>
          )}
        </div>
        {/* CONFIRM PASSWORD */}
        <div className="input-group">
          <label>Confirm Password</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setConfirmError("");
            }}
          />
          {confirmError && (
            <p className="input-error">
              {confirmError}
            </p>
          )}
        </div>
        {success && (
          <p className="success-message">
            {success}
          </p>
        )}
        <button
          type="button"
          className="primary-button"
          onClick={() => register()}
        >
          Create Account
        </button>
        <p className="create-account">
          Already have an account?{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => onBack()}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
/* HOME */
function HomePage({
  onSettings,
  onPatient,
  onCaretaker,
}: {
  onSettings: () => void;
  onPatient: () => void;
  onCaretaker: () => void;
}) {
  return (
    <div className="page-container">
      <header className="top-header">
        <div className="brand">
          <div className="brand-icon">
            <Brain size={28} />
          </div>
          <span>MindCare</span>
        </div>
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={onSettings}
            title="Settings"
          >
            <Settings size={23} />
          </button>
          <div className="user-icon">
            <UserRound size={23} />
          </div>
        </div>
      </header>
      <main className="home-content">
        <div className="welcome-section">
          <div className="welcome-badge">
            <Heart size={17} />
            Welcome back
          </div>
          <h2>How would you like to continue?</h2>
          <p>
            Choose a portal to get started.
          </p>
        </div>
        <div className="portal-grid">
          <button
            className="portal-card patient-card"
            onClick={onPatient}
          >
            <div className="portal-image">
              <Brain size={55} />
            </div>
            <div className="portal-info">
              <h3>Patient Portal</h3>
              <p>
                Games, puzzles and daily activities
              </p>
            </div>
            <span className="card-arrow">→</span>
          </button>
          <button
            className="portal-card caretaker-card"
            onClick={onCaretaker}
          >
            <div className="portal-image">
              <LockKeyhole size={53} />
            </div>
            <div className="portal-info">
              <h3>Caretaker Portal</h3>
              <p>
                Manage care and monitor progress
              </p>
            </div>
            <span className="card-arrow">→</span>
          </button>
        </div>
        <div className="home-note">
          <ShieldCheck size={20} />
          Your care journey, made simple and comfortable.
        </div>
      </main>
    </div>
  );
}
/* PATIENT PORTAL */
function PatientPortal({
  onBack,
  onActivity,
}: {
  onBack: () => void;
  onActivity: (activity: Activity) => void;
}) {
  return (
    <div className="page-container">
      <header className="top-header">
        <button
          className="back-button"
          onClick={onBack}
        >
          <ArrowLeft size={22} />
          Back
        </button>
        <div className="brand">
          <div className="brand-icon">
            <Brain size={28} />
          </div>
          <span>MindCare</span>
        </div>
        <div className="user-icon">
          <UserRound size={23} />
        </div>
      </header>
      <main className="patient-content">
        <div className="patient-heading">
          <div>
            <p className="hello-text">
              Patient Portal
            </p>
            <h2>
              Choose an activity 🌿
            </h2>
            <p>
              Take your time. There is no rush.
            </p>
          </div>
          <div className="patient-heart">
            <Heart size={42} />
          </div>
        </div>
        <div className="activity-grid">
          {[
            { title: "Working Memory Challenge", description: "Hold and work with information", icon: <Brain size={42} />, color: "green" },
            { title: "Tower of Hanoi", description: "Plan moves and solve a strategy puzzle", icon: <Puzzle size={42} />, color: "blue" },
            { title: "Rule Switching", description: "Sort familiar picture cards as the rule changes", icon: <Brain size={42} />, color: "mint" },
            { title: "Verbal Fluency", description: "Practice familiar everyday conversations", icon: <span className="text-icon">💬</span>, color: "pink" },
            { title: "Spatial Reasoning", description: "Slide number tiles into order", icon: <Puzzle size={42} />, color: "peach" },
            { title: "Scene Investigator", description: "Notice details and recall what you saw", icon: <Target size={42} />, color: "lavender" },
            { title: "Family Recognition", description: "Spend time with familiar faces", icon: <Heart size={42} />, color: "pink" },
            { title: "Voice & Music", description: "Listen, speak and enjoy familiar sounds", icon: <Mic size={42} />, color: "blue" },
          ].map((activity) => (
            <button
              className={`activity-card ${activity.color}`}
              key={activity.title}
              onClick={() => onActivity({
                title: activity.title,
                description: activity.description,
                image: "",
                icon: activity.icon,
                color: activity.color,
              })}
            >
              <div className="activity-image activity-symbol">{activity.icon}</div>
              <div className="activity-text">
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>
              </div>
              <span className="activity-arrow">→</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
function PicturePuzzle({
  onBack,
}: {
  onBack: () => void;
}) {
  const pictures = [
    "/icons/hero.png",
    "/icons/puz.png",
    "/icons/imagef.png",
    "/icons/imagem.png",
    "/icons/imagen.png",
    "/icons/num.png",
    "/icons/word.png",
    "/icons/ooo.png",
  ];
  const [gridSize, setGridSize] = useState(2);
  const [pieces, setPieces] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [picture, setPicture] = useState("");
  const createPuzzle = (size: number) => {
    const total = size * size;
    const shuffled = Array.from({ length: total }, (_, index) => index);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (shuffled.every((value, index) => value === index)) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
    const randomPicture =
      pictures[Math.floor(Math.random() * pictures.length)];
    setPicture(randomPicture);
    setPieces(shuffled);
    setSelected(null);
    setAttempts(0);
    setMistakes(0);
    setSeconds(0);
    setCompleted(false);
  };
  useEffect(() => {
    createPuzzle(gridSize);
  }, []);
  useEffect(() => {
    if (completed) return;
    const timer = setInterval(() => {
      setSeconds((previous) => previous + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [completed]);
  const handlePieceClick = (index: number) => {
    if (completed) return;
    if (selected === null) {
      setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    const newPieces = [...pieces];
    [newPieces[selected], newPieces[index]] = [
      newPieces[index],
      newPieces[selected],
    ];
    const solved = newPieces.every(
      (value, position) => value === position
    );
    setPieces(newPieces);
    setAttempts((previous) => previous + 1);
    setSelected(null);
    if (solved) {
      setCompleted(true);
    } else {
      setMistakes((previous) => previous + 1);
    }
  };
  const score = Math.max(0, 100 - mistakes * 5);
  useEffect(() => {
    if (completed) {
      const completedAt = new Date().toISOString();
      recordGameSession({
        game: "Picture Puzzle",
        score,
        correct: 1,
        wrong: mistakes,
        attempts: Math.max(1, attempts),
        roundsPlayed: 1,
        accuracy: score,
        startedAt: new Date(Date.now() - seconds * 1000).toISOString(),
        completedAt,
      });
    }
  }, [completed]);
  const nextPuzzle = () => {
    let nextSize = gridSize;
    if (score >= 85 && gridSize < 4) {
      nextSize = gridSize + 1;
    } else if (score < 60 && gridSize > 2) {
      nextSize = gridSize - 1;
    }
    setGridSize(nextSize);
    createPuzzle(nextSize);
  };
  return (
    <div className="puzzle-page">
      <div className="puzzle-top">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={22} />
          Back
        </button>
        <div className="puzzle-title">
          <Puzzle size={30} />
          <h2>Picture Puzzle</h2>
        </div>
        <div className="difficulty-badge">
          Level {gridSize - 1}
        </div>
      </div>
      <div className="puzzle-container">
        {!completed ? (
          <>
            <div className="puzzle-info">
              <div>
                <strong>Arrange the picture</strong>
                <span>Click two pieces to swap them.</span>
              </div>
              <div className="puzzle-stats">
                <span>⏱ {seconds}s</span>
                <span>🔄 {attempts}</span>
              </div>
            </div>
            <div
              className="puzzle-board"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              }}
            >
              {pieces.map((piece, index) => {
                const row = Math.floor(piece / gridSize);
                const column = piece % gridSize;
                return (
                  <button
                    key={index}
                    className={`puzzle-piece ${
                      selected === index ? "selected-piece" : ""
                    }`}
                    onClick={() => handlePieceClick(index)}
                    aria-label={`Puzzle piece ${index + 1}`}
                    style={{
                      backgroundImage: `url(${picture})`,
                      backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                      backgroundPosition: `${
                        (column * 100) / (gridSize - 1)
                      }% ${(row * 100) / (gridSize - 1)}%`,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                );
              })}
            </div>
            <div className="puzzle-help">
              <Puzzle size={22} />
              <span>
                Select one piece, then another piece to swap them.
              </span>
            </div>
            <button
              className="secondary-button"
              onClick={() => createPuzzle(gridSize)}
            >
              Start Again
            </button>
          </>
        ) : (
          <div className="puzzle-result">
            <div className="success-icon">🎉</div>
            <h2>Great Job!</h2>
            <p>You completed the puzzle.</p>
            <div className="result-grid">
              <div>
                <strong>{score}%</strong>
                <span>Score</span>
              </div>
              <div>
                <strong>{attempts}</strong>
                <span>Attempts</span>
              </div>
              <div>
                <strong>{seconds}s</strong>
                <span>Time</span>
              </div>
            </div>
            <div className="performance-message">
              {score >= 85 ? (
                <>
                  🌟 Excellent work!
                  <br />
                  Your next puzzle will be a little harder.
                </>
              ) : score < 60 ? (
                <>
                  🌿 Well done!
                  <br />
                  Your next puzzle will be a little easier.
                </>
              ) : (
                <>
                  👍 Good work!
                  <br />
                  We'll keep the same difficulty for now.
                </>
              )}
            </div>
            <div className="puzzle-actions">
              <button className="primary-button" onClick={nextPuzzle}>
                Next Puzzle
              </button>
              <button
                className="secondary-button"
                onClick={() => createPuzzle(gridSize)}
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function NumberPuzzle({
  onBack,
}: {
  onBack: () => void;
}) {
  const totalQuestions = 5;
  const [question, setQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const [gameFinished, setGameFinished] = useState(false);
  // Very simple counting questions
  const questions = [
    {
      emoji: "🍎",
      count: 2,
    },
    {
      emoji: "⭐",
      count: 3,
    },
    {
      emoji: "🌸",
      count: 4,
    },
    {
      emoji: "🍊",
      count: 5,
    },
    {
      emoji: "❤️",
      count: 3,
    },
  ];
  const currentQuestion = questions[question];
  const checkAnswer = () => {
    if (answer.trim() === "") {
      setMessage("Please enter a number.");
      return;
    }
    setAttempts((prev) => prev + 1);
    if (Number(answer) === currentQuestion.count) {
      setScore((prev) => prev + 1);
      setMessage("Correct! 🎉");
      setTimeout(() => {
        if (question + 1 >= totalQuestions) {
          setGameFinished(true);
        } else {
          setQuestion((prev) => prev + 1);
          setAnswer("");
          setMessage("");
        }
      }, 800);
    } else {
      setMessage("Try again 😊");
    }
  };
  const restartGame = () => {
    setQuestion(0);
    setAnswer("");
    setScore(0);
    setAttempts(0);
    setMessage("");
    setGameFinished(false);
  };
  // -------------------------
  // RESULT SCREEN
  // -------------------------
  useEffect(() => {
    if (gameFinished) {
      const completedAt = new Date().toISOString();
      const accuracy = attempts
        ? Math.round((score / attempts) * 100)
        : 0;
      recordGameSession({
        game: "Number Puzzle",
        score: Math.round((score / totalQuestions) * 100),
        correct: score,
        wrong: Math.max(0, attempts - score),
        attempts,
        roundsPlayed: totalQuestions,
        accuracy,
        startedAt: completedAt,
        completedAt,
      });
    }
  }, [gameFinished]);
  if (gameFinished) {
    const percentage = Math.round(
      (score / totalQuestions) * 100
    );
    return (
      <div className="page-container number-puzzle-page">
        <button
          className="back-button"
          onClick={onBack}
        >
          <ArrowLeft size={22} />
          Back
        </button>
        <div className="number-result-card">
          <div className="number-result-icon">
            🎉
          </div>
          <h1>Well Done!</h1>
          <p>
            You completed the Number Game.
          </p>
          <div className="number-result-score">
            {score} / {totalQuestions}
          </div>
          <h2>
            {percentage}% Correct
          </h2>
          <p>
            Attempts: {attempts}
          </p>
          <button
            className="primary-button"
            onClick={restartGame}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }
  // -------------------------
  // GAME SCREEN
  // -------------------------
  return (
    <div className="page-container number-puzzle-page">
      <button
        className="back-button"
        onClick={onBack}
      >
        <ArrowLeft size={22} />
        Back
      </button>
      <div className="number-game-card">
        <div className="number-game-header">
          <div className="number-icon-large">
            <span>123</span>
          </div>
          <div>
            <h1>Number Game</h1>
            <p>
              Count the objects carefully.
            </p>
          </div>
        </div>
        <div className="number-progress">
          Question {question + 1} of {totalQuestions}
        </div>
        {/* OBJECTS */}
        <div className="counting-objects">
          {Array.from({
            length: currentQuestion.count,
          }).map((_, index) => (
            <span
              key={index}
              className="counting-object"
            >
              {currentQuestion.emoji}
            </span>
          ))}
        </div>
        <h2>
          How many objects do you see?
        </h2>
        <input
          type="number"
          min="1"
          max="10"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setMessage("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              checkAnswer();
            }
          }}
          placeholder="Enter number"
          className="number-answer-input"
        />
        <button
          className="primary-button"
          onClick={checkAnswer}
        >
          Check Answer
        </button>
        {message && (
          <p
            className={
              message.startsWith("Correct")
                ? "correct-message"
                : "wrong-message"
            }
          >
            {message}
          </p>
        )}
        <div className="number-score">
          ⭐ Score: {score}
        </div>
      </div>
    </div>
  );
}
/* WORD PUZZLE */
function WordPuzzle({
  onBack,
}: {
  onBack: () => void;
}) {
  const questions = [
    { word: "APPLE", correct: "🍎", options: ["🍎", "🍌", "🍊"] },
    { word: "SUN", correct: "☀️", options: ["🌙", "☀️", "⭐"] },
    { word: "FLOWER", correct: "🌸", options: ["🌳", "🌸", "🍎"] },
    { word: "CAT", correct: "🐱", options: ["🐶", "🐱", "🐰"] },
    { word: "STAR", correct: "⭐", options: ["❤️", "⭐", "🌸"] },
  ];
  const [question, setQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const current = questions[question];
  const chooseAnswer = (answer: string) => {
    setAttempts((prev) => prev + 1);
    if (answer === current.correct) {
      setScore((prev) => prev + 1);
      setMessage("Correct! 🎉");
      setTimeout(() => {
        if (question === questions.length - 1) {
          setFinished(true);
        } else {
          setQuestion((prev) => prev + 1);
          setMessage("");
        }
      }, 700);
    } else {
      setMessage("Try again 😊");
    }
  };
  const restart = () => {
    setQuestion(0);
    setScore(0);
    setAttempts(0);
    setMessage("");
    setFinished(false);
  };
  useEffect(() => {
    if (finished) {
      const completedAt = new Date().toISOString();
      const accuracy = attempts
        ? Math.round((score / attempts) * 100)
        : 0;
      recordGameSession({
        game: "Word Puzzle",
        score: Math.round((score / questions.length) * 100),
        correct: score,
        wrong: Math.max(0, attempts - score),
        attempts,
        roundsPlayed: questions.length,
        accuracy,
        startedAt: completedAt,
        completedAt,
      });
    }
  }, [finished]);
  if (finished) {
    const percentage = Math.round(
      (score / questions.length) * 100
    );
    return (
      <div className="page-container puzzle-game-page">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={22} />
          Back
        </button>
        <div className="puzzle-result-card">
          <div className="result-big-icon">🎉</div>
          <h1>Word Puzzle Complete!</h1>
          <div className="result-score">
            {score} / {questions.length}
          </div>
          <h2>{percentage}% Correct</h2>
          <p>Attempts: {attempts}</p>
          <button className="primary-button" onClick={restart}>
            Play Again
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="page-container puzzle-game-page">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={22} />
        Back
      </button>
      <div className="word-game-card">
        <div className="puzzle-title-icon">🔤</div>
        <h1>Word Puzzle</h1>
        <p>Which picture matches this word?</p>
        <div className="word-question">
          {current.word}
        </div>
        <div className="word-options">
          {current.options.map((option) => (
            <button
              key={option}
              className="word-option"
              onClick={() => chooseAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
        {message && (
          <div
            className={
              message.startsWith("Correct")
                ? "correct-message"
                : "wrong-message"
            }
          >
            {message}
          </div>
        )}
        <div className="game-score">
          ⭐ Score: {score}
        </div>
        <div className="game-progress">
          Question {question + 1} / {questions.length}
        </div>
      </div>
    </div>
  );
}
/* ODD ONE OUT */
function OddOneOut({
  onBack,
}: {
  onBack: () => void;
}) {
  const questions = [
    { items: ["🍎", "🍎", "🍊", "🍎"], answer: "🍊" },
    { items: ["🐶", "🐶", "🐱", "🐶"], answer: "🐱" },
    { items: ["⭐", "⭐", "🌙", "⭐"], answer: "🌙" },
    { items: ["🌸", "🌸", "🌸", "🌻"], answer: "🌻" },
    { items: ["🍌", "🍌", "🍎", "🍌"], answer: "🍎" },
  ];
  const [question, setQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const current = questions[question];
  const chooseItem = (item: string) => {
    setAttempts((prev) => prev + 1);
    if (item === current.answer) {
      setScore((prev) => prev + 1);
      setMessage("Correct! 🎉");
      setTimeout(() => {
        if (question === questions.length - 1) {
          setFinished(true);
        } else {
          setQuestion((prev) => prev + 1);
          setMessage("");
        }
      }, 700);
    } else {
      setMessage("That's not different. Try again 😊");
    }
  };
  const restart = () => {
    setQuestion(0);
    setScore(0);
    setAttempts(0);
    setMessage("");
    setFinished(false);
  };
  useEffect(() => {
    if (finished) {
      const completedAt = new Date().toISOString();
      const accuracy = attempts
        ? Math.round((score / attempts) * 100)
        : 0;
      recordGameSession({
        game: "Odd One Out",
        score: Math.round((score / questions.length) * 100),
        correct: score,
        wrong: Math.max(0, attempts - score),
        attempts,
        roundsPlayed: questions.length,
        accuracy,
        startedAt: completedAt,
        completedAt,
      });
    }
  }, [finished]);
  if (finished) {
    const percentage = Math.round(
      (score / questions.length) * 100
    );
    return (
      <div className="page-container puzzle-game-page">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={22} />
          Back
        </button>
        <div className="puzzle-result-card">
          <div className="result-big-icon">🎉</div>
          <h1>Great Job!</h1>
          <p>You completed Odd One Out.</p>
          <div className="result-score">
            {score} / {questions.length}
          </div>
          <h2>{percentage}% Correct</h2>
          <p>Attempts: {attempts}</p>
          <button className="primary-button" onClick={restart}>
            Play Again
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="page-container puzzle-game-page">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={22} />
        Back
      </button>
      <div className="odd-game-card">
        <div className="puzzle-title-icon">👀</div>
        <h1>Odd One Out</h1>
        <p>Find the object that is different.</p>
        <div className="odd-options">
          {current.items.map((item, index) => (
            <button
              key={index}
              className="odd-option"
              onClick={() => chooseItem(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {message && (
          <div
            className={
              message.startsWith("Correct")
                ? "correct-message"
                : "wrong-message"
            }
          >
            {message}
          </div>
        )}
        <div className="game-score">
          ⭐ Score: {score}
        </div>
        <div className="game-progress">
          Question {question + 1} / {questions.length}
        </div>
      </div>
    </div>
  );
}
/* FAMILY RECOGNITION */
function FamilyRecognition({
  onBack,
}: {
  onBack: () => void;
}) {
  const [familyMembers] = useState<FamilyMember[]>(() => {
    const saved = localStorage.getItem("mindcareFamilyMembers");
    if (!saved) {
      return [];
    }
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<FamilyMember | null>(null);
  const [choices, setChoices] = useState<FamilyMember[]>([]);
  const [message, setMessage] = useState("");
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const totalRounds = 5;
  const createRound = (members: FamilyMember[]) => {
    if (members.length < 2) {
      setTarget(null);
      setChoices([]);
      return;
    }
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    const selectedTarget = shuffled[0];
    const otherMembers = shuffled.slice(1);
    const selectedChoices = [
      selectedTarget,
      ...otherMembers.slice(0, Math.min(2, otherMembers.length)),
    ].sort(() => Math.random() - 0.5);
    setTarget(selectedTarget);
    setChoices(selectedChoices);
    setMessage("");
    setAnswered(false);
  };
  useEffect(() => {
    createRound(familyMembers);
  }, [familyMembers]);
  const recordResult = (isCorrect: boolean) => {
    const saved = localStorage.getItem("mindcareRecognitionResults");
    let results: Array<{
      correct: boolean;
      timestamp: string;
    }> = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          results = parsed;
        }
      } catch {
        results = [];
      }
    }
    results.push({
      correct: isCorrect,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(
      "mindcareRecognitionResults",
      JSON.stringify(results.slice(-100))
    );
  };
  const chooseMember = (member: FamilyMember) => {
    if (!target || answered) {
      return;
    }
    const isCorrect = member.id === target.id;
    setAnswered(true);
    recordResult(isCorrect);
    if (isCorrect) {
      setCorrectAnswers((previous) => previous + 1);
      setMessage(`Yes, that's ${target.name}. ❤️`);
    } else {
      setMessage(
        `This is ${target.name}, ${target.relation}. Let's try another one. ❤️`
      );
    }
  };
  const nextRound = () => {
    if (round + 1 >= totalRounds) {
      setFinished(true);
      return;
    }
    setRound((previous) => previous + 1);
    createRound(familyMembers);
  };
  const restart = () => {
    setRound(0);
    setCorrectAnswers(0);
    setFinished(false);
    createRound(familyMembers);
  };

  useEffect(() => {
    if (finished) {
      const completedAt = new Date().toISOString();
      const accuracy = Math.round((correctAnswers / totalRounds) * 100);
      recordGameSession({
        game: "Family Recognition",
        score: accuracy,
        correct: correctAnswers,
        wrong: totalRounds - correctAnswers,
        attempts: totalRounds,
        roundsPlayed: totalRounds,
        accuracy,
        startedAt: completedAt,
        completedAt,
      });
    }
  }, [finished]);
  if (familyMembers.length < 2) {
    return (
      <div className="page-container recognition-page">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={22} />
          Back
        </button>
        <div className="recognition-card">
          <div className="recognition-icon">❤️</div>
          <h1>Family Recognition</h1>
          <p className="recognition-intro">
            Add at least two family members with photos before starting this
            activity.
          </p>
          <div className="recognition-empty">
            <Heart size={34} />
            <h2>More familiar faces needed</h2>
            <p>
              Ask the caretaker to add photos and names for family members.
              They will automatically appear here.
            </p>
          </div>
          <button className="primary-button" onClick={onBack}>
            Back to Activities
          </button>
        </div>
      </div>
    );
  }
  if (finished) {
    return (
      <div className="page-container recognition-page">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={22} />
          Back
        </button>
        <div className="recognition-card recognition-finished">
          <div className="recognition-icon">🌿</div>
          <h1>Lovely work</h1>
          <p>
            You spent some quiet time remembering familiar faces.
          </p>
          <div className="recognition-finished-message">
            <Heart size={28} />
            <span>
              That's enough for now. You can play again whenever you like.
            </span>
          </div>
          <button className="primary-button" onClick={restart}>
            Play Again
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="page-container recognition-page">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={22} />
        Back
      </button>
      <div className="recognition-card">
        <div className="recognition-top">
          <div>
            <p className="recognition-eyebrow">Family Recognition</p>
            <h1>Who is this?</h1>
            <p className="recognition-intro">
              Take your time and choose the familiar face.
            </p>
          </div>
          <div className="recognition-round">
            {round + 1} / {totalRounds}
          </div>
        </div>
        {target && (
          <>
            <div className="recognition-target">
              <img src={target.image} alt="Familiar family member" />
            </div>
            <div className="recognition-choice-grid">
              {choices.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  className={`recognition-choice ${
                    answered && member.id === target.id
                      ? "recognition-choice-correct"
                      : ""
                  }`}
                  onClick={() => chooseMember(member)}
                  disabled={answered}
                >
                  <img src={member.image} alt="" />
                  <span>{member.name}</span>
                </button>
              ))}
            </div>
            {message && (
              <div
                className={`recognition-message ${
                  message.startsWith("Yes")
                    ? "recognition-message-positive"
                    : "recognition-message-gentle"
                }`}
              >
                <Heart size={22} />
                <span>{message}</span>
              </div>
            )}
            {answered && (
              <button
                type="button"
                className="primary-button recognition-next"
                onClick={nextRound}
              >
                {round + 1 >= totalRounds ? "Finish" : "Next"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
/* MATCHING GAME */
function MatchingGame({
  onBack,
}: {
  onBack: () => void;
}) {
  const createCards = () => {
    const values = [
      "🍎", "🍎",
      "⭐", "⭐",
      "🌸", "🌸",
      "❤️", "❤️",
    ];
    return values
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        flipped: false,
        matched: false,
      }));
  };
  const [cards, setCards] = useState(createCards);
  const [firstCard, setFirstCard] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);
  const handleCardClick = (id: number) => {
    if (locked) return;
    const clicked = cards.find((card) => card.id === id);
    if (!clicked || clicked.flipped || clicked.matched) {
      return;
    }
    const updatedCards = cards.map((card) =>
      card.id === id
        ? { ...card, flipped: true }
        : card
    );
    setCards(updatedCards);
    if (firstCard === null) {
      setFirstCard(id);
      return;
    }
    if (firstCard === id) {
      return;
    }
    setMoves((prev) => prev + 1);
    setLocked(true);
    const first = updatedCards.find(
      (card) => card.id === firstCard
    );
    const second = updatedCards.find(
      (card) => card.id === id
    );
    if (
      first &&
      second &&
      first.value === second.value
    ) {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((card) =>
            card.id === firstCard || card.id === id
              ? {
                  ...card,
                  flipped: true,
                  matched: true,
                }
              : card
          )
        );
        setMatchedPairs((prev) => {
          const newCount = prev + 1;
          if (newCount === 4) {
            setTimeout(() => {
              setFinished(true);
            }, 500);
          }
          return newCount;
        });
        setFirstCard(null);
        setLocked(false);
      }, 500);
    } else {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((card) =>
            card.id === firstCard || card.id === id
              ? { ...card, flipped: false }
              : card
          )
        );
        setFirstCard(null);
        setLocked(false);
      }, 900);
    }
  };
  const restart = () => {
    setCards(createCards());
    setFirstCard(null);
    setMoves(0);
    setMatchedPairs(0);
    setLocked(false);
    setFinished(false);
  };
  useEffect(() => {
    if (finished) {
      const completedAt = new Date().toISOString();
      const accuracy = moves
        ? Math.round((matchedPairs / moves) * 100)
        : 0;
      recordGameSession({
        game: "Matching",
        score: Math.round((matchedPairs / 4) * 100),
        correct: matchedPairs,
        wrong: Math.max(0, moves - matchedPairs),
        attempts: moves,
        roundsPlayed: 4,
        accuracy,
        startedAt: completedAt,
        completedAt,
      });
    }
  }, [finished]);
  if (finished) {
    return (
      <div className="page-container puzzle-game-page">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={22} />
          Back
        </button>
        <div className="puzzle-result-card">
          <div className="result-big-icon">🎉</div>
          <h1>Excellent!</h1>
          <p>You matched all the pairs.</p>
          <div className="result-score">
            {matchedPairs} / 4
          </div>
          <h2>Moves: {moves}</h2>
          <button className="primary-button" onClick={restart}>
            Play Again
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="page-container puzzle-game-page">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={22} />
        Back
      </button>
      <div className="matching-game-card">
        <div className="puzzle-title-icon">🔗</div>
        <h1>Matching Game</h1>
        <p>Find two matching pictures.</p>
        <div className="matching-board">
          {cards.map((card) => (
            <button
              key={card.id}
              className={`matching-card ${
                card.flipped || card.matched
                  ? "matching-card-open"
                  : ""
              }`}
              onClick={() => handleCardClick(card.id)}
            >
              {card.flipped || card.matched
                ? card.value
                : "?"}
            </button>
          ))}
        </div>
        <div className="matching-stats">
          <span>⭐ Pairs: {matchedPairs} / 4</span>
          <span>🔄 Moves: {moves}</span>
        </div>
      </div>
    </div>
  );
}
/* ACTIVITY ROUTER */
function ActivityPage({
  activity,
  onBack,
}: {
  activity: Activity;
  onBack: () => void;
}) {
  if (["Working Memory Challenge", "Rule Switching", "Scene Investigator"].includes(activity.title)) {
    return <CognitiveGame title={activity.title} onBack={onBack} onComplete={(stats) => recordGameSession({ game: activity.title, ...stats })} />;
  }
  if (activity.title === "Verbal Fluency") {
    return <VerbalFluencyGame title={activity.title} onBack={onBack} onComplete={(stats) => recordGameSession({ game: activity.title, ...stats })} />;
  }
  if (activity.title === "Spatial Reasoning") {
    return <SlidingNumberPuzzle title={activity.title} onBack={onBack} onComplete={(stats) => recordGameSession({ game: activity.title, ...stats })} />;
  }
  if (activity.title === "Tower of Hanoi") {
    return <TowerOfHanoi title={activity.title} onBack={onBack} onComplete={(stats) => recordGameSession({ game: activity.title, ...stats })} />;
  }
  if (activity.title === "Voice & Music") {
    return <VoiceMusic onBack={onBack} onComplete={(stats) => recordGameSession({ game: activity.title, ...stats })} />;
  }
  if (activity.title === "Puzzles") {
    return <PicturePuzzle onBack={onBack} />;
  }
  if (activity.title === "Number Puzzle") {
    return <NumberPuzzle onBack={onBack} />;
  }
  if (activity.title === "Word Puzzle") {
    return <WordPuzzle onBack={onBack} />;
  }
  if (activity.title === "Odd One Out") {
    return <OddOneOut onBack={onBack} />;
  }
  if (activity.title === "Family Recognition") {
    return <FamilyRecognition onBack={onBack} />;
  }
  if (activity.title === "Matching") {
    return <MatchingGame onBack={onBack} />;
  }
  return (
    <div className="page-container">
      <header className="top-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={22} />
          Activities
        </button>
        <div className="brand">
          <div className="brand-icon">
            <Brain size={28} />
          </div>
          <span>MindCare</span>
        </div>
        <div className="user-icon">
          <UserRound size={23} />
        </div>
      </header>
      <main className="activity-page">
        <div className={`activity-hero ${activity.color}`}>
          <img
            src={activity.image}
            alt={activity.title}
            className="large-activity-image"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <h2>{activity.title}</h2>
          <p>{activity.description}</p>
        </div>
        <div className="coming-card">
          <div className="coming-icon">
            {activity.icon}
          </div>
          <h3>Ready to Begin?</h3>
          <p>
            This activity will be interactive.
            Your score, attempts and completion time
            will be recorded automatically.
          </p>
          <button
            className="primary-button"
            onClick={() =>
              alert("We will build this game next! 🧩")
            }
          >
            Start Activity
          </button>
        </div>
      </main>
    </div>
  );
}
/* SETTINGS */
function SettingsPage({
  onBack,
  onLogout,
}: {
  onBack: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="page-container">
      <header className="top-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={22} />
          Back
        </button>
        <div className="brand">
          <div className="brand-icon">
            <Settings size={27} />
          </div>
          <span>Settings</span>
        </div>
        <div />
      </header>
      <main className="settings-content">
        <h2>Settings</h2>
        <p className="settings-subtitle">
          Make MindCare comfortable for you.
        </p>
        <div className="settings-card">
          <SettingRow
            icon={<Globe />}
            title="Language"
            value="English"
          />
          <SettingRow
            icon={<Volume2 />}
            title="Sound"
            value="On"
          />
          <SettingRow
            icon={<UserRound />}
            title="Text Size"
            value="Large"
          />
          <SettingRow
            icon={<ShieldCheck />}
            title="Notifications"
            value="On"
          />
        </div>
        <button className="logout-button" onClick={onLogout}>
          <LogOut size={20} />
          Logout
        </button>
      </main>
    </div>
  );
}
function SettingRow({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="setting-row">
      <div className="setting-left">
        <div className="setting-icon">
          {icon}
        </div>
        <span>{title}</span>
      </div>
      <span className="setting-value">
        {value}
      </span>
    </div>
  );
}
export default App;
