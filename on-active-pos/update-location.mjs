import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hnyilsmevqenwpspuguz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhueWlsc21ldnFlbndwc3B1Z3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODE4NTIsImV4cCI6MjA5MDU1Nzg1Mn0.KPxw54vxL8IaS7gEPuZQbHa89joqeWESDJus_4e3scU'
);

async function updateStoreLocation() {
  console.log("Updating store location to -17.864004, 30.862077...");
  const { data, error } = await supabase
    .from('stores')
    .update({ latitude: -17.864004, longitude: 30.862077 })
    .neq('id', 'dummy'); // Updates all stores or a specific one if known. Usually there is only 1 or 2 stores.
    
  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Successfully updated location.");
  }
}

updateStoreLocation();
