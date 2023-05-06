import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import ProcessTable from "./modules/components/processTable";
import "./App.css";
import GenericButton from "./modules/components/Button";
import "./modules/components/button.css";
import ProcGraph from "./modules/components/procGraph";
// import GenericGraphic from "./modules/components/GenericGraph";
import GenericGraph from "./modules/components/GenericGraph";

const App = () => {
  const [isPause, setIsPause] = useState(true); 
  const handleClick = () => {
    setIsPause(!isPause);
    console.log(isPause);
  };

  return (
    <div className="row">
      <div className="column left">
        <h1>The Process Manager</h1>
      </div>
      <div className="column right">
        <div className="header">
          <h1>Processes</h1>
          {/* <h1>Ali Ashraf</h1> */}
          <button onClick={handleClick} className={isPause ? 'pause-button' : 'resume-button'}>
          {isPause ? 'Pause' : 'Resume'}
          </button>
          {/* <GenericButton buttonTitle={isPause ? 'Pause' : 'Resume'}
           handler={handleClick} cssClassName='my-button-class' /> */}
        </div>
        <ProcessTable isPause={isPause} />
        {/* <ProcGraph /> */}
        <div>
        {/* <GenericGraph pid={1958} graphLabel="CPU Usage" index={0} functionName="get_process_data"/> */}

        </div>
                {/* <ProcGraph /> */}
                {/* <div>
                <GenericGraph pid={1958} graphLabel="Memory Usage" index={1} functionName="get_process_data"/>

                </div> */}

      </div>
    </div>
  );
}

export default App;
// function App() {
//   const [greetMsg, setGreetMsg] = useState("");
//   const [name, setName] = useState("");

//   async function greet() {
//     // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
//     setGreetMsg(await invoke("greet", { name }));
//   }

//   return (
//     <div className="container">
//       <h1>Welcome to Tauri!</h1>

//       <div className="row">
//         <a href="https://vitejs.dev" target="_blank">
//           <img src="/vite.svg" className="logo vite" alt="Vite logo" />
//         </a>
//         <a href="https://tauri.app" target="_blank">
//           <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
//         </a>
//         <a href="https://reactjs.org" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>

//       <p>Click on the Tauri, Vite, and React logos to learn more.</p>

//       <div className="row">
//         <form
//           onSubmit={(e) => {
//             e.preventDefault();
//             greet();
//           }}
//         >
//           <input
//             id="greet-input"
//             onChange={(e) => setName(e.currentTarget.value)}
//             placeholder="Enter a name..."
//           />
//           <button type="submit">Greet</button>
//         </form>
//       </div>

//       <p>{greetMsg}</p>
//     </div>
//   );
// }

// export default App;