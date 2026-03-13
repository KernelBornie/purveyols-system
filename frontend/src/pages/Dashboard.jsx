import {
BarChart,
Bar,
XAxis,
YAxis,
Tooltip,
CartesianGrid
} from "recharts";

const data=[
{name:"Projects",value:12},
{name:"Workers",value:50},
{name:"Budget",value:8}
];

export default function Dashboard(){

return(

<div>

<h1>Construction Dashboard</h1>

<BarChart width={600} height={300} data={data}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="name"/>

<YAxis/>

<Tooltip/>

<Bar dataKey="value" fill="#1976d2"/>

</BarChart>

</div>

);

}