// Scaffold: in-memory notifications queue honoring simple throttles

type Notification = { recipient_user_id: string; message: string; type: string };

const queue: Notification[] = [];

export function enqueueNotification(n: Notification) {
  queue.push(n);
}

export function drainNotifications(): Notification[] {
  const copy = [...queue];
  queue.length = 0;
  return copy;
}
