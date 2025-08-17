import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Droplets, 
  Thermometer, 
  Sprout, 
  Sun, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Leaf,
  Clock,
  TrendingUp
} from 'lucide-react';
import { currentReadings, plantInfo, alerts, simulateRealTimeUpdate } from '../mockData';
import MetricCard from './MetricCard';
import HistoricalChart from './HistoricalChart';
import AlertsPanel from './AlertsPanel';

const Dashboard = () => {
  const [readings, setReadings] = useState(currentReadings);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    let interval;
    if (isLive) {
      interval = setInterval(() => {
        const updatedReadings = simulateRealTimeUpdate();
        setReadings({ ...updatedReadings });
      }, 3000); // Update every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'good': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Optimal</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>;
      case 'critical': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const calculateHealthScore = () => {
    const sensors = Object.values(readings);
    const goodCount = sensors.filter(sensor => sensor.status === 'good').length;
    return Math.round((goodCount / sensors.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Leaf className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plant Monitor</h1>
              <p className="text-gray-600">{plantInfo.name} • {plantInfo.location}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant={isLive ? "default" : "outline"}
              onClick={() => setIsLive(!isLive)}
              className="flex items-center space-x-2"
            >
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span>{isLive ? 'Live' : 'Paused'}</span>
            </Button>
            
            <Card className="px-4 py-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">Health Score</span>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  {calculateHealthScore()}%
                </Badge>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Metrics */}
          <div className="lg:col-span-3 space-y-6">
            {/* Current Readings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <MetricCard
                title="Water Level"
                value={readings.waterLevel.value}
                unit={readings.waterLevel.unit}
                status={readings.waterLevel.status}
                icon={Droplets}
                threshold={readings.waterLevel.threshold}
                iconColor="text-blue-600"
                bgColor="bg-blue-50"
              />
              
              <MetricCard
                title="Temperature"
                value={readings.temperature.value}
                unit={readings.temperature.unit}
                status={readings.temperature.status}
                icon={Thermometer}
                threshold={readings.temperature.threshold}
                iconColor="text-orange-600"
                bgColor="bg-orange-50"
              />
              
              <MetricCard
                title="Soil Moisture"
                value={readings.soilMoisture.value}
                unit={readings.soilMoisture.unit}
                status={readings.soilMoisture.status}
                icon={Sprout}
                threshold={readings.soilMoisture.threshold}
                iconColor="text-emerald-600"
                bgColor="bg-emerald-50"
              />
              
              <MetricCard
                title="Soil pH"
                value={readings.soilPH.value}
                unit={readings.soilPH.unit}
                status={readings.soilPH.status}
                icon={Sprout}
                threshold={readings.soilPH.threshold}
                iconColor="text-purple-600"
                bgColor="bg-purple-50"
              />
              
              <MetricCard
                title="Light Level"
                value={readings.light.value}
                unit={readings.light.unit}
                status={readings.light.status}
                icon={Sun}
                threshold={readings.light.threshold}
                iconColor="text-yellow-600"
                bgColor="bg-yellow-50"
              />
            </div>

            {/* Historical Charts */}
            <HistoricalChart />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Leaf className="h-5 w-5 text-emerald-600" />
                  <span>Plant Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{plantInfo.type}</p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-gray-600">Last Watered</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">2 hours ago</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Next Watering</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <p className="font-medium">In 22 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts Panel */}
            <AlertsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;