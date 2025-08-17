import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

const MetricCard = ({ 
  title, 
  value, 
  unit, 
  status, 
  icon: Icon, 
  threshold, 
  iconColor, 
  bgColor 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setDisplayValue(value);
      setIsAnimating(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [value]);

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
      case 'good': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Good</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>;
      case 'critical': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Calculate progress percentage based on threshold
  const calculateProgress = () => {
    if (!threshold) return 50;
    const range = threshold.max - threshold.min;
    const position = Math.max(0, Math.min(100, ((value - threshold.min) / range) * 100));
    return position;
  };

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg hover:scale-105 ${isAnimating ? 'scale-105' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-full ${bgColor}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Value Display */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                <span className={`transition-all duration-500 ${isAnimating ? 'scale-110' : ''}`}>
                  {typeof displayValue === 'number' ? displayValue.toFixed(1) : displayValue}
                </span>
                <span className="text-lg text-gray-500 ml-1">{unit}</span>
              </div>
            </div>
            {getStatusBadge(status)}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-700 ease-out ${getProgressColor(status)}`}
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            
            {threshold && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>{threshold.min}{unit}</span>
                <span>{threshold.max}{unit}</span>
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Status</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                status === 'good' ? 'bg-green-500' : 
                status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              } ${isAnimating ? 'animate-pulse' : ''}`} />
              <span className={`font-medium ${getStatusColor(status)}`}>
                {status === 'good' ? 'Optimal' : 
                 status === 'warning' ? 'Needs attention' : 'Critical'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;