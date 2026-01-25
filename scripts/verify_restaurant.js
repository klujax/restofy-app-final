const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const slug = 'efa-1768759798686';

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRestaurant() {
    console.log(`Checking restaurant with slug: ${slug}`);

    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching restaurant:', error);
        // Try by ID
        const { data: dataId, error: errorId } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', slug)
            .single();

        if (errorId) {
            console.error('Also not found by ID:', errorId);
        } else {
            console.log('Found by ID:', dataId);
        }
    } else {
        console.log('Restaurant found:', {
            id: data.id,
            name: data.name,
            slug: data.slug,
            is_active: data.is_active,
            owner_id: data.owner_id
        });
    }
}

checkRestaurant();
