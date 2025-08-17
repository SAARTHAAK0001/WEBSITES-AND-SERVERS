import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { historicalData } from '../mockData';
import { Droplets, Thermometer, Sprout, Sun } from 'lucide-react';

const HistoricalChart = () => {
  const [activeTab, setActiveTab] = useState('waterLevel');

  const chartConfigs = {
    waterLevel: {
      title: 'Water Level Trends',
      description: '24-hour water level monitoring',
      color: '#3B82F6',
      icon: Droplets,
      unit: '%',
      data: historicalData.waterLevel
    },
    temperature: {
      title: 'Temperature Trends',
      description: '24-hour temperature monitoring',
      color: '#F97316',
      icon: Thermometer,
      unit: '°C',
      data: historicalData.temperature
    },
    soilMoisture: {
      title: 'Soil Moisture Trends',
      description: '24-hour soil moisture monitoring',
      color: '#10B981',
      icon: Sprout,
      unit: '%',
      data: historicalData.soilMoisture
    },
    light: {
      title: 'Light Level Trends',
      description: '24-hour light exposure monitoring',
      color: '#EAB308',
      icon: Sun,
      unit: 'lux',
      data: historicalData.light
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const config = chartConfigs[activeTab];
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">{`Time: ${label}`}</p>
          <p className="text-sm font-medium" style={{ color: config.color }}>
            {`${config.title.split(' ')[0]} ${config.title.split(' ')[1]}: ${payload[0].value.toFixed(1)}${config.unit}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const ActiveIcon = chartConfigs[activeTab].icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 bg-blue-50 rounded-full">
            <ActiveIcon className="h-5 w-5 text-blue-600" />
          </div>
          <span>Historical Data</span>
        </CardTitle>
        <CardDescription>
          24-hour sensor data trends and patterns
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="waterLevel" className="flex items-center space-x-2">
              <Droplets className="h-4 w-4" />
              <span className="hidden sm:inline">Water</span>
            </TabsTrigger>
            <TabsTrigger value="temperature" className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4" />
              <span className="hidden sm:inline">Temp</span>
            </TabsTrigger>
            <TabsTrigger value="soilMoisture" className="flex items-center space-x-2">
              <Sprout className="h-4 w-4" />
              <span className="hidden sm:inline">Soil</span>
            </TabsTrigger>
            <TabsTrigger value="light" className="flex items-center space-x-2">
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Light</span>
            </TabsTrigger>
          </TabsList>

          {Object.entries(chartConfigs).map(([key, config]) => (
            <TabsContent key={key} value={key} className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
                  <p className="text-sm text-gray-600">{config.description}</p>
                </div>
                
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={config.data} margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}${config.unit}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={config.color}
                        strokeWidth={3}
                        dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: config.color, strokeWidth: 2 }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Current</p>
                    <p className="text-lg font-semibold" style={{ color: config.color }}>
                      {config.data[config.data.length - 1]?.value.toFixed(1)}{config.unit}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Average</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {(config.data.reduce((sum, item) => sum + item.value, 0) / config.data.length).toFixed(1)}{config.unit}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Range</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {Math.min(...config.data.map(item => item.value)).toFixed(1)} - {Math.max(...config.data.map(item => item.value)).toFixed(1)}{config.unit}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default HistoricalChart;