import { saveSubscriptionRequest } from '@/lib/save-subscription';

export async function POST(request: Request) {
  return saveSubscriptionRequest(request, null);
}
