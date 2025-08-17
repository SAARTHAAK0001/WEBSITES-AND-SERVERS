import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlantMonitoringAPI } from '../services/api';
import { Droplets, Thermometer, Sprout, Sun, RefreshCw } from 'lucide-react';

const HistoricalChart = () => {
  const [activeTab, setActiveTab] = useState('waterLevel');
  const [chartData, setChartData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const chartConfigs = {
    waterLevel: {
      title: 'Water Level Trends',
      description: '24-hour water level monitoring',
      color: '#3B82F6',
      icon: Droplets,
      unit: '%',
      apiKey: 'waterLevel'
    },
    temperature: {
      title: 'Temperature Trends',
      description: '24-hour temperature monitoring',
      color: '#F97316',
      icon: Thermometer,
      unit: '°C',
      apiKey: 'temperature'
    },
    soilMoisture: {
      title: 'Soil Moisture Trends',
      description: '24-hour soil moisture monitoring',
      color: '#10B981',
      icon: Sprout,
      unit: '%',
      apiKey: 'soilMoisture'
    },
    light: {
      title: 'Light Level Trends',
      description: '24-hour light exposure monitoring',
      color: '#EAB308',
      icon: Sun,
      unit: 'lux',
      apiKey: 'light'
    }
  };

  const fetchHistoricalData = async (sensor) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await PlantMonitoringAPI.getHistoricalData(sensor, 24);
      setChartData(prev => ({
        ...prev,
        [sensor]: data
      }));
    } catch (error) {
      console.error(`Failed to fetch historical data for ${sensor}:`, error);
      setError(`Failed to load ${sensor} data`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load data for the active tab
    const config = chartConfigs[activeTab];
    if (config && !chartData[config.apiKey]) {
      fetchHistoricalData(config.apiKey);
    }
  }, [activeTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const config = chartConfigs[newTab];
    if (config && !chartData[config.apiKey]) {
      fetchHistoricalData(config.apiKey);
    }
  };

  const ActiveIcon = chartConfigs[activeTab].icon;

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

  const currentConfig = chartConfigs[activeTab];
  const currentData = chartData[currentConfig.apiKey] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 rounded-full">
              <ActiveIcon className="h-5 w-5 text-blue-600" />
            </div>
            <span>Historical Data</span>
          </div>
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />}
        </CardTitle>
        <CardDescription>
          24-hour sensor data trends and patterns
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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

          <TabsContent value={activeTab} className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentConfig.title}</h3>
                <p className="text-sm text-gray-600">{currentConfig.description}</p>
              </div>
              
              {error ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-red-600 mb-2">{error}</p>
                    <button 
                      onClick={() => fetchHistoricalData(currentConfig.apiKey)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : currentData.length === 0 ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Loading historical data...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={currentData} margin={{
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
                          tickFormatter={(value) => `${value}${currentConfig.unit}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={currentConfig.color}
                          strokeWidth={3}
                          dot={{ fill: currentConfig.color, strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: currentConfig.color, strokeWidth: 2 }}
                          animationDuration={1000}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Current</p>
                      <p className="text-lg font-semibold" style={{ color: currentConfig.color }}>
                        {currentData.length > 0 ? currentData[currentData.length - 1]?.value.toFixed(1) : '0'}{currentConfig.unit}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Average</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentData.length > 0 ? (currentData.reduce((sum, item) => sum + item.value, 0) / currentData.length).toFixed(1) : '0'}{currentConfig.unit}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Range</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentData.length > 0 ? 
                          `${Math.min(...currentData.map(item => item.value)).toFixed(1)} - ${Math.max(...currentData.map(item => item.value)).toFixed(1)}${currentConfig.unit}` 
                          : `0 - 0${currentConfig.unit}`
                        }
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default HistoricalChart;