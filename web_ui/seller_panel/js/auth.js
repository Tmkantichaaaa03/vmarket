// กำหนด URL ฐานของ API
const BASE_API_URL = 'http://localhost/vmarket/api/auth/';

// ============== LOGIN LOGIC (index.html) ==============
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginMessage.textContent = '';
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const response = await fetch(BASE_API_URL + 'login_seller.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            loginMessage.textContent = `Login Successful! Welcome ${result.user_data.shop_name}. Redirecting...`;
            loginMessage.style.color = 'green';
            
            // บันทึกข้อมูลสำคัญไว้ใน Session Storage
            sessionStorage.setItem('seller_id', result.user_data.seller_id);
            sessionStorage.setItem('shop_name', result.user_data.shop_name);

            // เปลี่ยนหน้าไปที่หน้าจัดการสินค้าหลัก
            // (ต้องสร้างไฟล์ dashboard.html ในภายหลัง)
            window.location.href = 'dashboard.html'; 
        } else {
            loginMessage.textContent = 'Login Failed: ' + result.message;
            loginMessage.style.color = 'red';
        }
    });
}


// ============== REGISTER LOGIC (register.html) ==============
const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerMessage.textContent = '';
        
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const email = document.getElementById('regEmail').value;
        const shop_name = document.getElementById('regShopName').value;
        const address = document.getElementById('regAddress').value;

        const response = await fetch(BASE_API_URL + 'register_seller.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email, shop_name, address })
        });

        const result = await response.json();

        if (result.success) {
            registerMessage.textContent = 'Registration Successful! Redirecting to login...';
            registerMessage.style.color = 'green';
            
            // เปลี่ยนหน้ากลับไปที่หน้า Login หลังจากสมัครสำเร็จ
            setTimeout(() => {
                window.location.href = 'index.html'; 
            }, 2000); // หน่วงเวลา 2 วินาที
        } else {
            registerMessage.textContent = 'Registration Failed: ' + result.message;
            registerMessage.style.color = 'red';
        }
    });
}