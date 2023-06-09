import React from "react";
import { Line } from "react-chartjs-2";
import "@robloche/chartjs-plugin-streaming";
import "./styles.css";
import moment from "moment";
import { color } from 'chart.js/helpers'; 
import Chart from 'chart.js/auto';
import ChartStreaming from '@robloche/chartjs-plugin-streaming';
import 'chartjs-adapter-luxon';
import { invoke } from "@tauri-apps/api/tauri";


Chart.register(ChartStreaming);
// const Chart = require("react-chartjs-2").Chart;

Chart.defaults.set('plugins.streaming', {
  duration: 15000,
  refresh: 1000
});

const chartColors = {
  0: "rgb(255, 99, 132)",
  1: "rgb(255, 159, 64)",
  2: "rgb(255, 205, 86)",
  3: "rgb(75, 192, 192)",
  4: "rgb(54, 162, 235)",
  5: "rgb(153, 102, 255)",
  6: "rgb(201, 203, 207)"
};

// const color = Chart.helpers.color;
let stream = {
  datasets: [
    {
      label: "Memory",
      backgroundColor: color(chartColors[5])
        .alpha(0.5)
        .rgbString(),
      borderColor: chartColors[5],
      fill: false,
      lineTension: 0,
      borderDash: [8, 4],
      data: [],
      index : 0

    },
    {
      label: "Swap",
      backgroundColor: color(chartColors[3])
        .alpha(0.5)
        .rgbString(),
      borderColor: chartColors[3],
      fill: false,
      lineTension: 0,
      borderDash: [8, 4],
      data: [],
      index : 1

    },
  ]
};

// const cpu_cores = await invoke("get_curr_total_cpu");

// for (let i=0; i<cpu_cores.length; i++) {
//   console.log("Name = ");
//   console.log("CPU #".concat(toString(i+1)));
//   stream.datasets.push (
//     {
//       label: `CPU #${i+1}`,
//       backgroundColor: color(chartColors[i%7])
//         .alpha(0.5)
//         .rgbString(),
//       borderColor: chartColors[i%7],
//       fill: false,
//       lineTension: 0,
//       borderDash: [8, 4],
//       data: [],
//       index : i
//     }
//     );
//   }
  
  
const options = {
  scales: {
    x: {
      type: 'realtime',
      realtime: {
        onRefresh: async function(chart) {
          let newPoint = await invoke("get_memory_data");
          console.log(newPoint);
          
         
          
          chart.data.datasets.forEach(function(dataset) {
            dataset.data.push({
              x: Date.now(),
              y: newPoint[dataset.index]
              // y: Math.random()
            });
          });
        }
      }
    }, 
    y : {
      max: 101,
      min: 0,
      ticks: {
          stepSize: 0.5
      }
    }
  }
}

const cpu = invoke("get_curr_total_cpu").then(data => {console.log(data*1); (data*1)});
console.log("CPU Usage = {%f}\n", cpu);

const MemGraph = ({isPause}) => {

  Chart.defaults.set('plugins.streaming', {
    pause: !isPause
  });

  return (
    <div className="Graph">
      {/* <h1>{invoke("get_curr_total_cpu")}</h1> */}
      <Line data={stream} options={options} />
    </div>
  );
}

export default MemGraph;
