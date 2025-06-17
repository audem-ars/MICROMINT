// test-login.js - Test your login endpoint
const BASE_URL = 'http://localhost:3000'; // Change to your deployed URL if testing production

async function testLogin() {
    const testUser = {
        email: 'test@example.com',
        password: 'testpassword123'
    };

    try {
        console.log('🧪 Testing login endpoint...');
        
        const response = await fetch(`${BASE_URL}/api/auth?action=login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testUser)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log('📄 Response data:', data);

        if (response.ok) {
            console.log('✅ Login test successful!');
        } else {
            console.log('❌ Login test failed:', data.error);
        }

    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

async function testSignup() {
    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123'
    };

    try {
        console.log('🧪 Testing signup endpoint...');
        
        const response = await fetch(`${BASE_URL}/api/auth?action=signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testUser)
        });

        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📄 Response data:', data);

        if (response.ok) {
            console.log('✅ Signup test successful!');
        } else {
            console.log('❌ Signup test failed:', data.error);
        }

    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

// Run both tests
async function runTests() {
    await testSignup();
    console.log('---');
    await testLogin();
}

runTests();