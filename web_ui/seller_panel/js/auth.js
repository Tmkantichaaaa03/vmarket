const BASE_API_URL = 'http://localhost/vmarket/api/';

// ============== ฟังก์ชันสำหรับคุมการแสดงผล Error ใต้ช่องกรอก ==============

function toggleError(errorId, message, isError, inputElement) {
    const errorDisplay = document.getElementById(errorId);
    if (!errorDisplay) return;

    if (isError) {
        errorDisplay.innerText = "⚠️ " + message; 
        errorDisplay.classList.add('visible'); 
        inputElement.parentElement.classList.add('invalid');
    } else {
        errorDisplay.classList.remove('visible');
        inputElement.parentElement.classList.remove('invalid');
        
        // ล้างข้อความหลังจากหดกลับเสร็จ
        setTimeout(() => {
            if (!errorDisplay.classList.contains('visible')) {
                errorDisplay.innerText = "";
            }
        }, 300);
    }
}

// ตั้งค่าสีปุ่ม SweetAlert ให้เข้ากับธีมน้ำตาลของร้าน
const VMarketSwal = Swal.mixin({
    confirmButtonColor: '#a88b76',
    cancelButtonColor: '#d33'
});

// ============== REGISTER LOGIC ==============

const registerForm = document.getElementById('registerForm');

if (registerForm) {
    const regUsername = document.getElementById('regUsername');
    const regPassword = document.getElementById('regPassword');
    const regConfirm = document.getElementById('regConfirmPassword');

    // ตรวจสอบชื่อผู้ใช้
    regUsername.addEventListener('input', function() {
        const regex = /^[a-zA-Z0-9]*$/;
        if (!regex.test(this.value)) {
            toggleError('userError', "ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษหรือตัวเลขเท่านั้น", true, this);
        } else {
            toggleError('userError', "", false, this);
        }
    });

    // ตรวจสอบรหัสผ่าน
    regPassword.addEventListener('input', function() {
        if (this.value.length > 0 && this.value.length < 6) {
            toggleError('passError', "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร", true, this);
        } else {
            toggleError('passError', "", false, this);
        }
        if (regConfirm.value !== "") checkPasswordMatch();
    });

    regConfirm.addEventListener('input', checkPasswordMatch);

    function checkPasswordMatch() {
        if (regConfirm.value !== regPassword.value && regConfirm.value !== "") {
            toggleError('confirmError', "รหัสผ่านไม่ตรงกัน", true, regConfirm);
        } else {
            toggleError('confirmError', "", false, regConfirm);
        }
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // เช็คเงื่อนไขก่อนส่ง
        if (regPassword.value !== regConfirm.value || regPassword.value.length < 6) {
            VMarketSwal.fire({ icon: 'error', title: 'ข้อมูลไม่ถูกต้อง', text: 'กรุณาเช็คข้อความแจ้งเตือนสีแดงในฟอร์ม' });
            return;
        }

        const data = {
            username: regUsername.value,
            shop_name: document.getElementById('regShopName').value,
            address: document.getElementById('regAddress').value,
            email: document.getElementById('regEmail').value,
            phone_number: document.getElementById('regPhone').value,
            password: regPassword.value
        };

        try {
            const response = await fetch(BASE_API_URL + 'auth/register_seller.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result.success) {
                VMarketSwal.fire({
                    icon: 'success',
                    title: 'สมัครสมาชิกสำเร็จ!',
                    text: 'ยินดีต้อนรับสู่ V-Market',
                    showConfirmButton: false,
                    timer: 2000
                }).then(() => location.reload());
            } else {
                VMarketSwal.fire({ icon: 'error', title: 'ล้มเหลว', text: result.message });
            }
        } catch (error) {
            VMarketSwal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' });
        }
    });
}

// ============== LOGIN LOGIC ==============

const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(BASE_API_URL + 'auth/login_seller.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                // แจ้งเตือนมุมขวาบน (Toast)
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `สวัสดีคุณ ${result.user_data.shop_name}`,
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true
                }).then(() => {
                    sessionStorage.setItem('seller_id', result.user_data.seller_id);
                    sessionStorage.setItem('shop_name', result.user_data.shop_name);
                    window.location.href = 'dashboard.html'; 
                });
            } else {
                VMarketSwal.fire({ icon: 'error', title: 'เข้าสู่ระบบไม่สำเร็จ', text: result.message });
            }
        } catch (error) {
            VMarketSwal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'กรุณาลองใหม่อีกครั้ง' });
        }
    });
}