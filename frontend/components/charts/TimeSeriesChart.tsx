// "use client";

// import { ApexOptions } from "apexcharts";
// import dynamic from 'next/dynamic';
// const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

// var dates = [
//     [1327359600000, 30.95],
//     [1327446000000, 31.34],
//     [1327532400000, 31.18],
//     [1327618800000, 31.05],
//     [1327878000000, 31.00],
//     [1327964400000, 30.95],
//     [1328050800000, 31.24],
//     [1328137200000, 31.29],
//     [1328223600000, 31.85],
//     [1328482800000, 31.86],
//     [1328569200000, 32.28],
//     [1328655600000, 32.10],
//     [1328742000000, 32.65],
//     [1328828400000, 32.21],
//     [1329087600000, 32.35],
//     [1329174000000, 32.44],
//     [1329260400000, 32.46],
//     [1329346800000, 32.86],
//     [1329433200000, 32.75],
//     [1329778800000, 32.54],
//     [1329865200000, 32.33],
//     [1329951600000, 32.97],
//     [1330038000000, 33.41],
//     [1330297200000, 33.27],
//     [1330383600000, 33.27],
//     [1330470000000, 32.89],
//     [1330556400000, 33.10],
//     [1330642800000, 33.73],
// ];

// const chartOptions: ApexOptions = {
//     series: [{
//         name: 'Bitcoin',
//         data: dates
//     }],
//     chart: {
//         type: 'area',
//         stacked: false,
//         height: 350,
//         zoom: {
//             type: 'x',
//             enabled: true,
//             autoScaleYaxis: true
//         },
//         toolbar: {
//             show: false
//         },
//     },
//     stroke: {
//         curve: 'straight',
//         width: 2,
//         lineCap: 'round',
//     },
//     dataLabels: {
//         enabled: false
//     },
//     markers: {
//         size: 0,
//     },
//     grid: {
//         borderColor: '#D1D5DB',
//         strokeDashArray: 3,
//     },
//     fill: {
//         type: 'gradient',
//         gradient: {
//             type: 'vertical',  // Gradient direction (vertical)
//             shadeIntensity: 1, // Intensity of the gradient shading
//             gradientToColors: ['#487FFF'], // Bottom gradient color (with transparency)
//             inverseColors: false, // Do not invert colors
//             opacityFrom: .4, // Starting opacity
//             opacityTo: .1,  // Ending opacity
//             stops: [0, 100],
//         },
//     },
//     yaxis: {
//         labels: {
//             formatter: function (val) {
//                 return (val / 1000000).toFixed(0);
//             },
//         },
//         title: {
//             text: 'Price'
//         },
//     },
//     xaxis: {
//         type: 'datetime',
//     },
//     tooltip: {
//         shared: false,
//         y: {
//             formatter: function (val) {
//                 return (val / 1000000).toFixed(0);
//             }
//         }
//     }
// };

// const chartSeries = [{
//     name: 'Bitcoin',
//     data: dates
// }]

// const TimeSeriesChart = () => {
//     return (
//         <div className="-m-4">
//             <Chart
//                 options={chartOptions}
//                 series={chartSeries}
//                 type="line"
//                 height={264}
//             />
//         </div>
//     );
// };

// export default TimeSeriesChart









"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// ✅ Correct data format
const dates = [
  { x: 1327359600000, y: 30.95 },
  { x: 1327446000000, y: 31.34 },
  { x: 1327532400000, y: 31.18 },
  { x: 1327618800000, y: 31.05 },
  { x: 1327878000000, y: 31.0 },
  { x: 1327964400000, y: 30.95 },
  { x: 1328050800000, y: 31.24 },
  { x: 1328137200000, y: 31.29 },
  { x: 1328223600000, y: 31.85 },
  { x: 1328482800000, y: 31.86 },
  { x: 1328569200000, y: 32.28 },
  { x: 1328655600000, y: 32.1 },
  { x: 1328742000000, y: 32.65 },
  { x: 1328828400000, y: 32.21 },
  { x: 1329087600000, y: 32.35 },
  { x: 1329174000000, y: 32.44 },
  { x: 1329260400000, y: 32.46 },
  { x: 1329346800000, y: 32.86 },
  { x: 1329433200000, y: 32.75 },
];

// ✅ Options
const chartOptions: ApexOptions = {
  chart: {
    type: "area", // ✅ keep consistent
    height: 350,
    zoom: {
      enabled: true,
      type: "x",
      autoScaleYaxis: true,
    },
    toolbar: { show: false },
  },

  stroke: {
    curve: "straight", // looks better
    width: 2,
  },

  dataLabels: { enabled: false },
  markers: { size: 0 },

  grid: {
    borderColor: "#D1D5DB",
    strokeDashArray: 3,
  },

  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      gradientToColors: ["#487FFF"],
      opacityFrom: 0.4,
      opacityTo: 0.1,
      stops: [0, 100],
    },
  },

  xaxis: {
    type: "datetime",
  },

  yaxis: {
    labels: {
      formatter: (val) => val.toFixed(2), // ✅ FIXED
    },
    title: { text: "Price" },
  },

  tooltip: {
    y: {
      formatter: (val) => `$${val.toFixed(2)}`, // ✅ FIXED
    },
  },
};

// ✅ Series
const chartSeries = [
  {
    name: "Bitcoin",
    data: dates,
  },
];

const TimeSeriesChart = () => {
  return (
    <div className="-m-4">
      <Chart
        options={chartOptions}
        series={chartSeries}
        type="area" 
        height={350}
      />
    </div>
  );
};

export default TimeSeriesChart;