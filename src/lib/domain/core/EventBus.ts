type EventHandler = (data: any, eventName: string) => void;

interface Subscription {
  eventName: string;
  handler: EventHandler;
  subscriberId: string;
}

export class EventBus {
  private subscribers: Subscription[] = [];
  
  on(eventName: string, handler: EventHandler, subscriberId?: string): void {
    this.subscribers.push({
      eventName,
      handler,
      subscriberId: subscriberId || `sub-${Date.now()}-${Math.random()}`
    });
  }
  
  off(eventName: string, subscriberId?: string): void {
    this.subscribers = this.subscribers.filter(sub => {
      if (subscriberId) {
        return !(sub.eventName === eventName && sub.subscriberId === subscriberId);
      }
      return sub.eventName !== eventName;
    });
  }
  
  emit(eventName: string, data: any): void {
    this.subscribers
      .filter(sub => sub.eventName === eventName || sub.eventName === '*')
      .forEach(sub => sub.handler(data, eventName));
  }
}
