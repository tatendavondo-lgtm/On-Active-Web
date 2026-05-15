import { Badge } from '../shared/Badge';

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  switch (status) {
    case 'pending':
      return <Badge variant="info" className="bg-gray-500/10 text-gray-400 border-gray-500/20">Pending</Badge>;
    case 'confirmed':
      return <Badge variant="info">Confirmed</Badge>;
    case 'preparing':
      return <Badge variant="warning">Preparing</Badge>;
    case 'ready':
      return <Badge variant="success" className="animate-pulse">Ready</Badge>;
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'cancelled':
    case 'refunded':
      return <Badge variant="error" className="capitalize">{status}</Badge>;
    default:
      return <Badge variant="info" className="capitalize">{status}</Badge>;
  }
}
