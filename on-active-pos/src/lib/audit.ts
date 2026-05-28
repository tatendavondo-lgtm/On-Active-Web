import { supabase } from '../config/supabase';

export async function logPosAction({
  userId,
  userName,
  userRole,
  action,
  targetType,
  targetId,
  details = {},
  storeId
}: {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: any;
  storeId?: string;
}) {
  try {
    await supabase.rpc('log_pos_action', {
      p_user_id: userId,
      p_user_name: userName,
      p_user_role: userRole,
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId || '',
      p_details: details,
      p_store_id: storeId
    });
  } catch (err) {
    console.error('POS Audit logging failed:', err);
  }
}
