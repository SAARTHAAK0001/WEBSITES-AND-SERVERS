import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useToast } from '../hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  Bell,
  Clock,
  RefreshCw
} from 'lucide-react';
import { PlantMonitoringAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await PlantMonitoringAPI.getAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch alerts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertBadge = (type) => {
    switch (type) {
      case 'critical': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>;
      case 'info': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Info</Badge>;
      case 'success': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Success</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await PlantMonitoringAPI.acknowledgeAlert(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      ));
      toast({
        title: "Success",
        description: "Alert acknowledged",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await PlantMonitoringAPI.dismissAlert(alertId);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      toast({
        title: "Success",
        description: "Alert dismissed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive",
      });
    }
  };

  const clearAllAlerts = async () => {
    try {
      // Dismiss all alerts one by one
      await Promise.all(alerts.map(alert => PlantMonitoringAPI.dismissAlert(alert.id)));
      setAlerts([]);
      toast({
        title: "Success",
        description: "All alerts cleared",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear all alerts",
        variant: "destructive",
      });
    }
  };

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <span>Alerts</span>
            <RefreshCw className="h-4 w-4 animate-spin text-gray-500 ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Loading alerts...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <span>Alerts</span>
          </div>
          <div className="flex items-center space-x-2">
            {unacknowledgedCount > 0 && (
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                {unacknowledgedCount} new
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAlerts}
              className="p-1 h-6 w-6"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-80">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mb-3" />
              <p className="text-sm text-gray-600">All systems normal</p>
              <p className="text-xs text-gray-400">No active alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={alert.id}>
                  <div className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    alert.acknowledged 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-l-4 border-l-orange-400 shadow-sm'
                  }`}>
                    <div className="flex items-start justify-between space-x-2">
                      <div className="flex items-start space-x-2 flex-1">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {getAlertBadge(alert.type)}
                            <span className="text-xs text-gray-500 capitalize">
                              {alert.sensor_type}
                            </span>
                          </div>
                          <p className={`text-sm ${alert.acknowledged ? 'text-gray-600' : 'text-gray-900'}`}>
                            {alert.message}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        {!alert.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="h-6 px-2 text-xs"
                          >
                            Ack
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissAlert(alert.id)}
                          className="h-6 w-6 p-0 hover:bg-red-50"
                        >
                          <X className="h-3 w-3 text-gray-400 hover:text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {index < alerts.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {alerts.length > 0 && (
          <div className="pt-3 border-t mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={clearAllAlerts}
            >
              Clear All Alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;