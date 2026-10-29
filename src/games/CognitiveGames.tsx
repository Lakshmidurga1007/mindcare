import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, RotateCcw, CheckCircle2, Lightbulb, ChevronRight } from "lucide-react";
import "./CognitiveGames.css";

type GameStats = { score: number; correct: number; wrong: number; attempts: number; roundsPlayed: number; accuracy: number; startedAt: string; completedAt: string; level?: number; challenge?: string };
type Props = { title: string; onBack: () => void; onComplete?: (stats: GameStats) => void };
type Question = { prompt: string; options: string[]; answer: string; explanation: string; stimulus?: string; visual?: boolean };

type PictureItem = { emoji: string; name: string; category: string };
const ITEMS: PictureItem[] = [
  {emoji:"🍎",name:"Apple",category:"fruit"},{emoji:"🍌",name:"Banana",category:"fruit"},{emoji:"🍇",name:"Grapes",category:"fruit"},{emoji:"🍊",name:"Orange",category:"fruit"},{emoji:"🍓",name:"Strawberry",category:"fruit"},{emoji:"🥭",name:"Mango",category:"fruit"},
  {emoji:"🥕",name:"Carrot",category:"vegetable"},{emoji:"🥦",name:"Broccoli",category:"vegetable"},{emoji:"🍅",name:"Tomato",category:"vegetable"},{emoji:"🥔",name:"Potato",category:"vegetable"},
  {emoji:"🔑",name:"Key",category:"home"},{emoji:"☕",name:"Cup",category:"home"},{emoji:"📖",name:"Book",category:"home"},{emoji:"👓",name:"Glasses",category:"home"},{emoji:"🕯️",name:"Candle",category:"home"},{emoji:"🪥",name:"Toothbrush",category:"home"},{emoji:"🧦",name:"Socks",category:"clothing"},{emoji:"🧣",name:"Scarf",category:"clothing"},{emoji:"👒",name:"Hat",category:"clothing"},{emoji:"👕",name:"Shirt",category:"clothing"},
  {emoji:"🌷",name:"Flower",category:"garden"},{emoji:"🌳",name:"Tree",category:"garden"},{emoji:"🪴",name:"Plant",category:"garden"},{emoji:"🌻",name:"Sunflower",category:"garden"},{emoji:"🪴",name:"Potted plant",category:"garden"},{emoji:"🧤",name:"Garden gloves",category:"garden"},
  {emoji:"🚗",name:"Car",category:"transport"},{emoji:"🚲",name:"Bicycle",category:"transport"},{emoji:"🚌",name:"Bus",category:"transport"},{emoji:"🚂",name:"Train",category:"transport"},{emoji:"🚤",name:"Boat",category:"transport"},
  {emoji:"🐈",name:"Cat",category:"animal"},{emoji:"🐕",name:"Dog",category:"animal"},{emoji:"🐦",name:"Bird",category:"animal"},{emoji:"🐟",name:"Fish",category:"animal"},{emoji:"🐄",name:"Cow",category:"animal"},{emoji:"🐇",name:"Rabbit",category:"animal"},
  {emoji:"🥄",name:"Spoon",category:"kitchen"},{emoji:"🍽️",name:"Plate",category:"kitchen"},{emoji:"🫖",name:"Teapot",category:"kitchen"},{emoji:"🍞",name:"Bread",category:"food"},{emoji:"🧀",name:"Cheese",category:"food"},{emoji:"🍪",name:"Biscuit",category:"food"},
];

const pick = <T,>(items:T[], index:number) => items[((index % items.length) + items.length) % items.length];
const shuffle = <T,>(items:T[], seed:number):T[] => [...items].map((item,i)=>({item,sort:Math.sin((seed+1)*(i+3)*12.9898)*43758.5453%1})).sort((a,b)=>a.sort-b.sort).map(x=>x.item);
const itemLabel = (item:PictureItem) => `${item.emoji} ${item.name}`;

function makeQuestion(title:string, level:number):Question {
  const seed = level - 1;

  if (title === "Working Memory Challenge") {
    const length = 3 + Math.min(2, Math.floor(seed / 20));
    const start = (seed * 3) % ITEMS.length;
    const sequence = Array.from({length},(_,i)=>pick(ITEMS,start + i * (1 + (seed % 3))));
    const mode = seed % 4;
    const target = mode === 0 ? sequence[0] : mode === 1 ? sequence[sequence.length-1] : pick(sequence,Math.floor(sequence.length/2));
    const distractors = shuffle(ITEMS.filter(x=>!sequence.some(s=>s.name===x.name)),seed).slice(0,2);
    const options = shuffle([target,...distractors],seed+13).map(itemLabel);
    const answer = itemLabel(target);
    const prompt = mode===0 ? "Which picture appeared FIRST?" : mode===1 ? "Which picture appeared LAST?" : "Which picture was part of the sequence?";

    return {stimulus:sequence.map(itemLabel).join("   "),prompt,options,answer,explanation:`${target.name} was ${mode===0?"shown first":mode===1?"shown last":"included in the sequence"}.`,visual:true};
  }

  if (title === "Rule Switching") {
    const categories = ["fruit","animal","garden","transport","clothing","kitchen","home","food"];
    const category = pick(categories, Math.floor(seed/2));
    const matches = ITEMS.filter(x=>x.category===category);
    const correct = pick(matches,seed*2);
    const wrongItems = shuffle(ITEMS.filter(x=>x.category!==category),seed+4).slice(0,2);
    const options = shuffle([correct,...wrongItems],seed+8).map(itemLabel);
    const labels:Record<string,string> = {fruit:"FRUIT",animal:"ANIMAL",garden:"GARDEN ITEM",transport:"TRANSPORT",clothing:"CLOTHING",kitchen:"KITCHEN ITEM",home:"EVERYDAY HOME ITEM",food:"FOOD"};

    return {prompt:`New rule: choose the picture that is a ${labels[category]}.`,options,answer:itemLabel(correct),explanation:`${correct.name} matches the ${labels[category].toLowerCase()} rule.`,visual:true};
  }

  // Scene Investigator: a picture-based scene with a question about what was seen.
  const sceneLength = 4 + Math.min(2,Math.floor(seed/25));
  const scene = shuffle(ITEMS,seed+33).slice(0,sceneLength);
  const isMissing = seed % 2 === 0;
  const target = isMissing ? pick(ITEMS.filter(x=>!scene.some(s=>s.name===x.name)),seed+5) : pick(scene,seed+7);
  const distractors = isMissing ? shuffle(scene.filter(x=>x.name!==target.name),seed+17).slice(0,2) : shuffle(ITEMS.filter(x=>!scene.some(s=>s.name===x.name)),seed+17).slice(0,2);
  const options = shuffle([target,...distractors],seed+22).map(itemLabel);

  return {stimulus:scene.map(itemLabel).join("   "),prompt:isMissing?"Which picture was NOT in the scene?":"Which picture WAS in the scene?",options,answer:itemLabel(target),explanation:isMissing?`${target.name} was not in the scene.`:`${target.name} was included in the scene.`,visual:true};
}

function SessionFrame({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return <div className="page-container cognitive-page"><header className="top-header"><button className="back-button" onClick={onBack}><ArrowLeft size={22}/> Activities</button><div className="brand"><div className="brand-icon">MC</div><span>MindCare</span></div></header><main className="cognitive-content"><div className="cognitive-title"><span>COGNITIVE PRACTICE</span><h1>{title}</h1><p>Take your time. You can pause or return to activities whenever you wish.</p></div>{children}</main></div>;
}

function useProgress(title:string) {
  const key = `mindcare-${title.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-unlocked`;
  const [unlocked,setUnlocked] = useState(()=>Math.max(1,Number(localStorage.getItem(key)||1)));
  const unlock = (level:number) => { const next = Math.max(unlocked,Math.min(120,level)); setUnlocked(next); localStorage.setItem(key,String(next)); };
  return {unlocked,unlock};
}

export default function CognitiveGame({ title, onBack, onComplete }: Props) {
  const isMemory = title === "Working Memory Challenge";
  const isRule = title === "Rule Switching";
  const {unlocked,unlock} = useProgress(title);
  const [level,setLevel] = useState(1);
  const [selected,setSelected] = useState<string|null>(null);
  const [stimulusHidden,setStimulusHidden] = useState(false);
  const [startedAt,setStartedAt] = useState(()=>new Date().toISOString());
  const question = useMemo(()=>makeQuestion(title,level),[title,level]);

  const nextLevel = () => { const next=Math.min(120,level+1); unlock(next); setLevel(next); setSelected(null); setStimulusHidden(false); setStartedAt(new Date().toISOString()); };
  const selectLevel = (value:number) => { if(value<=unlocked){setLevel(value);setSelected(null);setStimulusHidden(false);setStartedAt(new Date().toISOString());} };

  const answer = (option:string) => {
    if(selected) return;
    setSelected(option);
    const correct = option===question.answer;
    onComplete?.({score:correct?100:0,correct:correct?1:0,wrong:correct?0:1,attempts:1,roundsPlayed:1,accuracy:correct?100:0,startedAt,completedAt:new Date().toISOString()});
    if(correct) unlock(level+1);
  };

  // Corrected: removed the unused index variable.
  const options = question.options.map((option)=>{
    const correct = option===question.answer;
    return <button key={`${level}-${option}`} className={`cognitive-option ${question.visual?"picture-option":""} ${selected===option?(correct?"is-correct":"is-wrong"):""}`} onClick={()=>answer(option)} disabled={!!selected} aria-label={option}>{question.visual?<><span className="picture-option-emoji">{option.split(" ")[0]}</span><span>{option.substring(option.indexOf(" ")+1)}</span></>:option}</button>;
  });

  return <SessionFrame title={title} onBack={onBack}><section className="cognitive-panel">
    <div className="level-header"><div><span className="level-kicker">LEVEL</span><strong>{level} <small>of 120</small></strong></div><div className="level-picker"><label htmlFor="cognitive-level">Choose level</label><select id="cognitive-level" value={level} onChange={e=>selectLevel(Number(e.target.value))}>{Array.from({length:unlocked},(_,i)=><option key={i+1} value={i+1}>Level {i+1}</option>)}</select></div></div>
    <div className="cognitive-progress-track"><span style={{width:`${(level/120)*100}%`}}/></div>
    <div className="cognitive-progress"><span>Case {level} of 120</span><span>{unlocked} level{unlocked===1?"":"s"} available</span></div>
    {question.stimulus && !stimulusHidden ? <div className="stimulus-card"><span>{isMemory?"Look carefully at these pictures":"Study this scene"}</span><div className="picture-stimulus">{question.stimulus.split("   ").map((x,i)=><span className="stimulus-item" key={`${x}-${i}`}><b>{x.split(" ")[0]}</b><small>{x.substring(x.indexOf(" ")+1)}</small></span>)}</div><button className="cognitive-primary" onClick={()=>setStimulusHidden(true)}>I'm ready</button></div> : <><h2>{question.prompt}</h2><div className={`cognitive-options ${question.visual?"picture-options-grid":""}`}>{options}</div></>}
    {selected&&<div className="cognitive-feedback"><CheckCircle2 size={20}/><span>{selected===question.answer?"Well done! ":"That's okay. "+"Let's learn together. "}{question.explanation}</span></div>}
    <div className="cognitive-actions"><button className="cognitive-secondary" onClick={onBack}>Exit activity</button>{selected&&level<120&&<button className="cognitive-primary" onClick={nextLevel}>Next level <ChevronRight size={18}/></button>}{selected&&level===120&&<button className="cognitive-primary" onClick={()=>{setLevel(1);setSelected(null);setStimulusHidden(false);}}>Play again</button>}</div>
  </section><p className="cognitive-note"><Lightbulb size={16}/> {isRule?"Look at the pictures and follow the new sorting rule.":isMemory?"Pictures are shown first, then hidden. There is no timer.":"Look at the scene first, then choose a picture based on what you remember."} No penalty for mistakes.</p></SessionFrame>;
}

const conversationCases = [
  {situation:"A friend visits and says, 'Hello! How are you today?'",options:["I'm doing well, thank you.","The window is blue.","Put the shoes away."],answer:"I'm doing well, thank you."},
  {situation:"You feel thirsty. What could you say?",options:["May I have some water?","The train is sleeping.","I wore a cloud."],answer:"May I have some water?"},
  {situation:"Someone helps you carry a bag. What could you say?",options:["Thank you for helping me.","The lamp is running.","I have seven windows."],answer:"Thank you for helping me."},
  {situation:"You want to know the time. What could you ask?",options:["Could you tell me the time?","Please close the garden.","The spoon is singing."],answer:"Could you tell me the time?"},
  {situation:"You are ready to eat. What could you say?",options:["Shall we have lunch?","The bicycle is hungry.","I can fold a rainbow."],answer:"Shall we have lunch?"},
  {situation:"You need help opening a jar.",options:["Could you help me open this?","The clouds are on the floor.","I have a purple Tuesday."],answer:"Could you help me open this?"},
  {situation:"You meet someone in the morning.",options:["Good morning!","Good night, breakfast.","The chair is a river."],answer:"Good morning!"},
  {situation:"You need to leave a visit politely.",options:["It was lovely seeing you. Goodbye!","The cup is outside tomorrow.","Please eat the clock."],answer:"It was lovely seeing you. Goodbye!"},
  {situation:"You didn't hear what someone said.",options:["Could you please repeat that?","The wall is listening.","I bought a Tuesday."],answer:"Could you please repeat that?"},
  {situation:"Someone asks if you would like tea.",options:["Yes, please. Thank you.","The garden is a shoe.","I sleep in a spoon."],answer:"Yes, please. Thank you."},
  {situation:"You want to sit down.",options:["May I sit here?","The rain is a plate.","I can open a banana."],answer:"May I sit here?"},
  {situation:"You arrive at a shop and want to buy bread.",options:["Could I have a loaf of bread, please?","The clock is made of soup.","Please drive the flower."],answer:"Could I have a loaf of bread, please?"},
  {situation:"You want to know where the bathroom is.",options:["Could you show me where the bathroom is?","The pillow is a road.","I have a singing spoon."],answer:"Could you show me where the bathroom is?"},
  {situation:"A family member asks whether you are comfortable.",options:["Yes, I'm comfortable, thank you.","The garden is in my pocket.","A cloud can eat lunch."],answer:"Yes, I'm comfortable, thank you."},
  {situation:"You would like the window opened.",options:["Would you mind opening the window?","The book is wearing shoes.","I can drink a chair."],answer:"Would you mind opening the window?"},
  {situation:"Someone gives you a lovely gift.",options:["What a thoughtful gift. Thank you!","The bus is a flower.","Please fold the sunlight."],answer:"What a thoughtful gift. Thank you!"},
  {situation:"You are introduced to a new person.",options:["It's nice to meet you.","The table is a river.","I wear a spoon."],answer:"It's nice to meet you."},
  {situation:"You would like to make a phone call.",options:["May I use the phone, please?","The rain is eating breakfast.","I can close a banana."],answer:"May I use the phone, please?"},
  {situation:"You want to know what is for dinner.",options:["What are we having for dinner?","The shoes are made of tea.","I can read the clouds."],answer:"What are we having for dinner?"},
  {situation:"A person looks upset. You want to check on them.",options:["Are you okay? Can I help?","The clock is swimming.","The flower is a train."],answer:"Are you okay? Can I help?"},
  {situation:"You accidentally bump into someone.",options:["I'm sorry. Are you all right?","The window is a sandwich.","I can wear the table."],answer:"I'm sorry. Are you all right?"},
  {situation:"You want to join a group conversation.",options:["May I join you?","The garden is sleeping in a cup.","I can fold a train."],answer:"May I join you?"},
  {situation:"Someone asks how your day went.",options:["It was nice, thank you for asking.","The spoon is a mountain.","I put the sky in a bag."],answer:"It was nice, thank you for asking."},
  {situation:"You need a little more time to get ready.",options:["Please give me a few more minutes.","The moon is under the plate.","I can read a shoe."],answer:"Please give me a few more minutes."},
  {situation:"You want to ask someone to speak more slowly.",options:["Could you speak a little more slowly, please?","The chair is drinking water.","I can eat the window."],answer:"Could you speak a little more slowly, please?"},
  {situation:"A visitor is leaving your home.",options:["Thank you for coming. Visit again soon!","The pillow is driving a bus.","Please open the banana."],answer:"Thank you for coming. Visit again soon!"},
  {situation:"You want to offer someone a seat.",options:["Would you like to sit here?","The clock is a bowl.","I can carry the sunshine."],answer:"Would you like to sit here?"},
  {situation:"You need to tell someone you are feeling cold.",options:["I'm feeling cold. Could I have a blanket?","The tree is eating a key.","I can paint the train."],answer:"I'm feeling cold. Could I have a blanket?"},
  {situation:"You want to ask about a family photograph.",options:["Who is in this photograph?","The spoon is wearing a hat.","I can drink a book."],answer:"Who is in this photograph?"},
  {situation:"You want to say something nice about a meal.",options:["This meal is delicious. Thank you.","The bus is sleeping in the garden.","I can wear some soup."],answer:"This meal is delicious. Thank you."},
  {situation:"You are ready to go for a walk.",options:["Would you like to go for a walk with me?","The lamp is a river.","I can fold a cup."],answer:"Would you like to go for a walk with me?"},
];

export function VerbalFluencyGame({ onBack, onComplete }: Props) {
  const [level,setLevel] = useState(1);
  const [selected,setSelected] = useState<string|null>(null);
  const [startedAt,setStartedAt] = useState(()=>new Date().toISOString());
  const {unlocked,unlock}=useProgress("Everyday Conversation");
  const question=pick(conversationCases,(level-1));

  const choose=(option:string)=>{
    if(selected)return;
    setSelected(option);
    const ok=option===question.answer;
    onComplete?.({score:ok?100:0,correct:ok?1:0,wrong:ok?0:1,attempts:1,roundsPlayed:1,accuracy:ok?100:0,startedAt,completedAt:new Date().toISOString()});
    if(ok)unlock(level+1);
  };

  const next=()=>{
    setLevel(v=>v===conversationCases.length?1:v+1);
    setSelected(null);
    setStartedAt(new Date().toISOString());
  };

  return <SessionFrame title="Everyday Conversation" onBack={onBack}><section className="cognitive-panel"><div className="level-header"><div><span className="level-kicker">LEVEL</span><strong>{level} <small>of {conversationCases.length}</small></strong></div><div className="level-picker"><label htmlFor="conversation-level">Choose level</label><select id="conversation-level" value={level} onChange={e=>{const v=Number(e.target.value);if(v<=unlocked){setLevel(v);setSelected(null);setStartedAt(new Date().toISOString());}}}>{Array.from({length:unlocked},(_,i)=><option key={i+1} value={i+1}>Level {i+1}</option>)}</select></div></div><div className="conversation-scene"><span className="conversation-icon">💬</span><p>What would you say?</p><h2>{question.situation}</h2></div><div className="cognitive-options">{question.options.map((option,i)=><button key={option} className={`cognitive-option ${selected===option?(option===question.answer?"is-correct":"is-wrong"):""}`} disabled={!!selected} onClick={()=>choose(option)}><span className="conversation-option-number">{["A","B","C"][i]}</span>{option}</button>)}</div>{selected&&<div className="cognitive-feedback"><CheckCircle2 size={20}/><span>{selected===question.answer?"That is a kind, clear response.":`Good try. A helpful response could be: “${question.answer}”`}</span></div>}<div className="cognitive-actions"><button className="cognitive-secondary" onClick={onBack}>Exit activity</button>{selected&&<button className="cognitive-primary" onClick={next}>Next situation <ChevronRight size={18}/></button>}</div></section><p className="cognitive-note"><Lightbulb size={16}/> A familiar everyday conversation activity. There is no time limit and no penalty for mistakes.</p></SessionFrame>;
}

export function TowerOfHanoi({ onBack, onComplete }: Props) {
  const [level, setLevel] = useState(1);
  const [disks, setDisks] = useState(3);
  const [startPeg, setStartPeg] = useState(0);
  const [targetPeg, setTargetPeg] = useState(2);
  const [pegs, setPegs] = useState<number[][]>([[3, 2, 1], [], []]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [finished, setFinished] = useState(false);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const progress = useProgress("Tower of Hanoi");
  const unlocked = Math.min(100, progress.unlocked);
  const unlock = progress.unlock;
  const challengeNames = ["Plan the transfer", "Change the destination", "Start from a new peg", "Think several moves ahead", "Efficient move challenge"];
  const challenge = challengeNames[Math.floor((level - 1) / 4) % challengeNames.length];

  const reset = (newLevel = level) => {
    const count = Math.min(7, 3 + Math.floor((newLevel - 1) / 12));
    const source = Math.floor((newLevel - 1) / 3) % 3;
    const destination = (source + 1 + (Math.floor((newLevel - 1) / 4) % 2)) % 3;
    const nextPegs: number[][] = [[], [], []];
    nextPegs[source] = Array.from({ length: count }, (_, i) => count - i);
    setLevel(newLevel);
    setDisks(count);
    setStartPeg(source);
    setTargetPeg(destination);
    setPegs(nextPegs);
    setChosen(null);
    setMoves(0);
    setFinished(false);
    setStartedAt(new Date().toISOString());
  };

  const selectPeg = (peg: number) => {
    if (finished) return;
    if (chosen === null) {
      if (pegs[peg].length) setChosen(peg);
      return;
    }
    if (chosen === peg) {
      setChosen(null);
      return;
    }

    const source = [...pegs[chosen]];
    const destination = [...pegs[peg]];
    const disk = source[source.length - 1];

    if (destination.length && destination[destination.length - 1] < disk) {
      setChosen(null);
      return;
    }

    source.pop();
    destination.push(disk);
    const next = pegs.map((stack) => [...stack]);
    next[chosen] = source;
    next[peg] = destination;
    setPegs(next);
    setMoves((value) => value + 1);
    setChosen(null);

    if (peg === targetPeg && next[targetPeg].length === disks) {
      setFinished(true);
      if (level < 100) unlock(level + 1);
      const moveCount = moves + 1;
      const minimumMoves = 2 ** disks - 1;
      const efficiency = Math.max(0, Math.min(100, Math.round((minimumMoves / moveCount) * 100)));

      onComplete?.({
        score: efficiency,
        correct: 1,
        wrong: 0,
        attempts: 1,
        roundsPlayed: 1,
        accuracy: efficiency,
        startedAt,
        completedAt: new Date().toISOString(),
        level,
        challenge,
      });
    }
  };

  return <SessionFrame title="Tower of Hanoi" onBack={onBack}>
    <section className="cognitive-panel">
      <div className="level-header">
        <div><span className="level-kicker">LEVEL</span><strong>{level} <small>of 100</small></strong></div>
        <div className="level-picker"><label htmlFor="hanoi-level">Choose level</label><select id="hanoi-level" value={level} onChange={(event) => { const value = Number(event.target.value); if (value <= unlocked) reset(value); }}>{Array.from({ length: unlocked }, (_, index) => <option key={index + 1} value={index + 1}>Level {index + 1}</option>)}</select></div>
      </div>
      <div className="hanoi-challenge-card"><span>THIS LEVEL'S CHALLENGE</span><strong>{challenge}</strong><p>{disks} disks · Start at Peg {startPeg + 1} · Move all disks to Peg {targetPeg + 1}</p></div>
      <p>Move one disk at a time. A larger disk cannot sit on a smaller disk. There is no timer—plan at your own pace.</p>
      <div className="hanoi-board">{pegs.map((peg, index) => <button className={`hanoi-peg ${chosen === index ? "selected" : ""} ${index === targetPeg ? "target-peg" : ""}`} key={index} onClick={() => selectPeg(index)} aria-label={`Peg ${index + 1}${peg.length ? `, top disk ${peg[peg.length - 1]}` : ", empty"}`}>
        <span className="hanoi-stack">{peg.map((disk, diskIndex) => <span key={`${index}-${disk}`} className={`hanoi-disk ${chosen === index && diskIndex === peg.length - 1 ? "hanoi-disk-lifted" : ""}`} style={{ width: `${Math.max(24, 90 - (disks - disk) * 10)}%` }}>{disk}</span>)}</span>
        <span className="hanoi-base">Peg {index + 1}{index === targetPeg ? " · Goal" : ""}</span>
      </button>)}</div>
      <p className="hanoi-moves">Moves made: <strong>{moves}</strong> · Minimum moves: {2 ** disks - 1}</p>
      {finished && <div className="cognitive-feedback"><CheckCircle2 size={20} /><span>Level complete! Your move efficiency was {Math.max(0, Math.min(100, Math.round(((2 ** disks - 1) / Math.max(1, moves)) * 100)))}%. You can continue whenever you're ready.</span></div>}
      <div className="cognitive-actions"><button className="cognitive-secondary" onClick={onBack}>Exit activity</button><button className="cognitive-secondary" onClick={() => reset()}><RotateCcw size={17} /> Restart level</button>{finished && level < 100 && <button className="cognitive-primary" onClick={() => reset(level + 1)}>Next challenge <ChevronRight size={18} /></button>}</div>
    </section>
    <p className="cognitive-note"><Lightbulb size={16} /> Each level changes the starting peg, destination, or disk count. Selecting a tower lifts its top disk so it is easy to see which disk will move.</p>
  </SessionFrame>;
}

export function SlidingNumberPuzzle({onBack,onComplete}:Props){
  const {unlocked,unlock}=useProgress("Spatial Reasoning");
  const [level,setLevel]=useState(1);
  const [tiles,setTiles]=useState<number[]>(()=>makePuzzle(1));
  const [moves,setMoves]=useState(0);
  const [startedAt,setStartedAt]=useState(()=>new Date().toISOString());
  const [finished,setFinished]=useState(false);

  function makePuzzle(l:number){
    const arr=[1,2,3,4,5,6,7,8,0];
    let prev=-1;
    for(let i=0;i<60+Math.min(160,l*2);i++){
      const empty=arr.indexOf(0);
      const neighbors=[empty-3,empty+3,...(empty%3>0?[empty-1]:[]),...(empty%3<2?[empty+1]:[])].filter(n=>n>=0&&n<9&&Math.abs(n-empty)!==2);
      const valid=neighbors.filter(n=>n!==prev);
      const next=pick(valid.length?valid:neighbors,l*31+i*7);
      [arr[empty],arr[next]]=[arr[next],arr[empty]];
      prev=empty;
    }
    return arr;
  }

  const solved=tiles.every((v,i)=>v===(i===8?0:i+1));

  const move=(index:number)=>{
    if(finished||tiles[index]===0)return;
    const empty=tiles.indexOf(0);
    if(Math.abs(index-empty)!==3&&!(Math.floor(index/3)===Math.floor(empty/3)&&Math.abs(index-empty)===1))return;

    const next=[...tiles];
    [next[index],next[empty]]=[next[empty],next[index]];
    setTiles(next);
    setMoves(v=>v+1);

    if(next.every((v,i)=>v===(i===8?0:i+1))){
      setFinished(true);
      unlock(level+1);
      onComplete?.({score:Math.max(0,100-Math.max(0,moves+1-30)),correct:1,wrong:0,attempts:moves+1,roundsPlayed:1,accuracy:100,startedAt,completedAt:new Date().toISOString()});
    }
  };

  const startLevel=(l:number)=>{
    setLevel(l);
    setTiles(makePuzzle(l));
    setMoves(0);
    setFinished(false);
    setStartedAt(new Date().toISOString());
  };

  return <SessionFrame title="Spatial Reasoning" onBack={onBack}>
    <section className="cognitive-panel">
      <div className="level-header">
        <div><span className="level-kicker">LEVEL</span><strong>{level} <small>of 120</small></strong></div>
        <div className="level-picker"><label htmlFor="spatial-level">Choose level</label><select id="spatial-level" value={level} onChange={e=>{const l=Number(e.target.value);if(l<=unlocked)startLevel(l);}}>{Array.from({length:unlocked},(_,i)=><option key={i+1} value={i+1}>Level {i+1}</option>)}</select></div>
      </div>
      <p>Slide one tile at a time into the empty square. Arrange the numbers from 1 to 8.</p>
      <div className="number-slide-board" aria-label="Sliding number puzzle">{tiles.map((tile,i)=><button key={`${level}-${i}-${tile}`} className={`number-slide-tile ${tile===0?"empty-tile":""}`} onClick={()=>move(i)} disabled={finished||tile===0} aria-label={tile===0?"Empty square":`Move tile ${tile}`}>{tile||""}</button>)}</div>
      <div className="spatial-status"><span>Moves: <strong>{moves}</strong></span><span>{solved?"Solved!":"Goal: 1 → 8"}</span></div>
      {finished&&<div className="cognitive-feedback"><CheckCircle2 size={20}/>Wonderful! All numbers are in order.</div>}
      <div className="cognitive-actions"><button className="cognitive-secondary" onClick={onBack}>Exit activity</button><button className="cognitive-secondary" onClick={()=>startLevel(level)}><RotateCcw size={17}/> Restart</button>{finished&&level<120&&<button className="cognitive-primary" onClick={()=>startLevel(level+1)}>Next level <ChevronRight size={18}/></button>}</div>
    </section>
    <p className="cognitive-note"><Lightbulb size={16}/> The puzzle uses a solvable random arrangement at each level. You can take as much time as you need.</p>
  </SessionFrame>;
}