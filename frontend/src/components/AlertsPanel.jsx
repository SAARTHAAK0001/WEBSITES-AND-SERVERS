import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  Bell,
  Clock
} from 'lucide-react';
import { alerts as initialAlerts } from '../mockData';
import { formatDistanceToNow } from 'date-fns';

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState(initialAlerts);

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

  const acknowledgeAlert = (alertId) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true }
        : alert
    ));
  };

  const dismissAlert = (alertId) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <span>Alerts</span>
          </div>
          {unacknowledgedCount > 0 && (
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
              {unacknowledgedCount} new
            </Badge>
          )}
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
                              {alert.sensor}
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
              onClick={() => setAlerts([])}
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