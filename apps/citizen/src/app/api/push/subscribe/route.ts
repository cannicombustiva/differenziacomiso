import { saveSubscriptionRequest } from '@differenzia/core/save-subscription';

export async function POST(request: Request) {
  return saveSubscriptionRequest(request, null);
}
