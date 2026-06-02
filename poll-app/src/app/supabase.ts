import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js'

@Injectable({
  providedIn: 'root',
})
export class Supabase {
    supabaseUrl = 'https://ogudjorvmctzuybwqtip.supabase.co'
    supabaseKey = 'sb_publishable_LhFI7nGSosl57l4BNRgY_Q_xWFNLcy3'
    supabase = createClient(this.supabaseUrl, this.supabaseKey)
}



