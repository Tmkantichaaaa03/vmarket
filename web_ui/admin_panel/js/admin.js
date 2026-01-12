const BASE_API_URL = 'http://localhost/vmarket/api/';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password';

// DOM Elements
const loginForm = document.getElementById('loginForm'); 
const loginMessage = document.getElementById('loginMessage'); 
const pendingTableBody = document.querySelector('#pendingTable tbody'); 
const dashboardMessage = document.getElementById('dashboardMessage'); 


// ============== ฟังก์ชันควบคุมการเข้าถึง (Access Control & Redirect) =================


// ตรวจสอบสิทธิ์ (ใช้ใน admin_home.html และ admin_product_detail.html)
function checkAuthAdmin() {
    if (sessionStorage.getItem('admin_auth') !== 'true') {
        alert('You must be logged in to access the dashboard.');
        window.location.href = 'index.html'; // Redirect ไปหน้า Login (index.html)
    }
}

// ตรวจสอบ Login (ใช้ใน index.html - หน้า Login)
function checkLoginAdmin() {
    if (sessionStorage.getItem('admin_auth') === 'true') {
        window.location.href = 'admin_home.html'; // ถ้าล็อกอินแล้วไปหน้า Dashboard
    }
}

// จัดการ Logout
function logout() {
    sessionStorage.removeItem('admin_auth'); 
    window.location.href = 'index.html'; // Redirect ไปหน้า Login (index.html)
}


// ================== Login Logic ====================

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        loginMessage.textContent = '';

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            loginMessage.textContent = 'Login Successful';
            loginMessage.style.color = 'green';

            sessionStorage.setItem('admin_auth', 'true');

            window.location.href = 'admin_home.html'; 
            
        } else {
            loginMessage.textContent = 'Invalid Credentials' ;
            loginMessage.style.color = 'red';
        }
    });
}

// ==================== admin_home.html ==========================

async function loadPendingProducts() {
    
    const pendingTableBody = document.querySelector('#pendingTable tbody'); 
    const dashboardMessage = document.getElementById('dashboardMessage');

    pendingTableBody.innerHTML = '<tr><td colspan="7">Loading pending products...</td></tr>';
    dashboardMessage.textContent = '';

    try {
        const response = await fetch(`${BASE_API_URL}admin/get_pending_products.php`, {
            method: 'GET'
        });

        const result = await response.json();

        pendingTableBody.innerHTML = ''; 

        if (result.success && result.data && result.data.length > 0) {
            document.getElementById('pendingCount').textContent = result.data.length;

            result.data.forEach(product => {
                console.log(product); // Debug ดูชื่อ field จริง

                const row = pendingTableBody.insertRow();

                // ตรวจสอบ field ที่ API ส่งมา
                const productName = product.name || product.product_name || '-';
                const sellerId = product.seller_id ?? product.seller ?? product.sellerID ?? product.shop_name ?? '-';
                const price = product.price != null ? parseFloat(product.price).toFixed(2) : '-';
                const description = product.description ? product.description.substring(0, 50) + '...' : '-';
                const model3D = product.model_3d || 'No 3D Model';

                row.insertCell().textContent = product.product_id || '-';
                row.insertCell().textContent = productName;
                row.insertCell().textContent = sellerId;
                row.insertCell().textContent = price;
                row.insertCell().textContent = description;
                row.insertCell().textContent = model3D;

                const actionCell = row.insertCell();
                actionCell.innerHTML = `
                    <a href="admin_product_detail.html?id=${product.product_id}" class="approve-btn" style="padding: 5px; text-decoration: none;">Review & Approve</a>
                    <button class="reject-btn" onclick="handleApproval(${product.product_id}, 'rejected')">Reject</button>
                `;
            });
        } else {
            dashboardMessage.textContent = 'No products are currently pending approval.';
            document.getElementById('pendingCount').textContent = 0;
        }

    } catch (error) {
        dashboardMessage.textContent = 'Error connecting to API. Check XAMPP/Server status.';
        console.error('Fetch Error:', error);
    }
}


// ================= admin_product_detail.html ====================

async function loadAdminProductDetail() {
    
    const detailContainer = document.getElementById('admin-dashboard-detail');

    // ทำให้หน้าแสดงผลทันทีที่โหลดผ่าน checkAuth
    if (detailContainer) {
        detailContainer.style.display = 'block'; 
    }

    const message = document.getElementById('detailMessage');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        message.textContent = 'Error: Product ID is missing in URL.';
        message.style.color = 'red';
        return;
    }

    message.textContent = `Loading details for Product ID ${productId}...`;
    message.style.color = 'orange';
    
    // ส่วนการโหลดข้อมูลที่เหลือ

    try {
        const response = await fetch(`${BASE_API_URL}products/get_products.php?product_id=${productId}`, {
            method: 'GET'
        });
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            const product = result.data[0]; 

            document.getElementById('productName').textContent = product.name;
            document.getElementById('detailProductId').textContent = product.product_id;
            document.getElementById('detailSellerId').textContent = product.seller_id;
            document.getElementById('detailDescription').textContent = product.description;
            document.getElementById('detailPrice').textContent = parseFloat(product.price).toFixed(2);
            document.getElementById('detailStock').textContent = product.stock;
            document.getElementById('detailImage').textContent = product.image;
            document.getElementById('detailModel3D').textContent = product.model_3d;
            
            const statusElement = document.getElementById('detailApprovalStatus');
            statusElement.textContent = product.approval_status;
            statusElement.className = 'status-' + product.approval_status;

            const imgElement = document.getElementById('productImage');
            if (product.image) {
                imgElement.src = `../seller_panel/assets/images/${product.image}`; 
                imgElement.style.display = 'block';
            }
            
            const detailImageList = document.getElementById('detailImageList'); 
            detailImageList.innerHTML = ''; 

            if (product.detail_images && product.detail_images.length > 0) {
                product.detail_images.forEach(image_url => {
                    const img = document.createElement('img');
                    img.src = `../seller_panel/assets/images/${image_url}`;
                    img.alt = `Detail Image: ${image_url}`;
                    img.style.maxWidth = '150px';
                    img.style.marginRight = '10px';
                    img.style.border = '1px solid #ccc';
                    
                    // เพิ่ม onerror เพื่อจัดการ 404 (ถ้าไฟล์รูปไม่มีอยู่จริง)
                    img.onerror = function() {
                        img.style.display = 'none';
                        detailImageList.textContent = `Image file (${image_url}) not found on server.`;
                        console.warn(`404 Warning: Image ${image_url} failed to load.`);
                    };
                    
                    detailImageList.appendChild(img);
                });
            } else {
                detailImageList.textContent = 'No detailed images submitted for 3D modeling.';
            }
            
            // แสดง Seller Model Path (เพื่อตรวจสอบ)
            document.getElementById('detailModel3D').textContent = product.model_3d || 'No 3D Model submitted by seller.';

            // 🎯 เพิ่ม Logic การแสดงลิงก์ดาวน์โหลดเพื่อตรวจสอบไฟล์ 3D ของ Seller
            const sellerModelContainer = document.getElementById('sellerModelLink'); // ต้องเพิ่ม Element นี้ใน HTML
            sellerModelContainer.innerHTML = ''; // Clear content

            if (product.model_3d) {
                const link = document.createElement('a');
                // Path ต้องชี้ไปที่โฟลเดอร์ models ใน web_ui
                link.href = `../../web_ui/assets/models/${product.model_3d}`; 
                link.textContent = `Download Seller Model: ${product.model_3d}`;
                link.target = '_blank';
                link.className = 'button'; // ใช้ปุ่มเพื่อให้มองเห็นชัดเจน
                sellerModelContainer.appendChild(link);
                
                // เพิ่มการแจ้งเตือนว่าไฟล์ 3D ถูกส่งมาแล้ว 
                document.getElementById('modelStatus').textContent = 'Seller submitted a 3D model file for review.';

            } else {
                document.getElementById('modelStatus').textContent = 'Seller did NOT submit an initial 3D model.';
            }

            document.getElementById('adminNotes').value = product.admin_notes || '';

            message.textContent = 'Details loaded successfully. Ready for review.';
            message.style.color = 'green';
            
        } else {
            message.textContent = 'Error: Product data not found.';
            message.style.color = 'red';
        }

    } catch (error) {
        message.textContent = 'Network error occurred while fetching details.';
        console.error('Fetch Error:', error);
        message.style.color = 'red';
    }
}

// ================= Logic การอนุมัติ/ปฏิเสธ (รองรับ File Upload) =================

async function handleApproval(productId, status) {
    
    let adminNotes = '';
    let model3DFile = null;

    // ตรวจสอบว่าเป็นหน้า Detail (มี input สำหรับไฟล์และโน้ต)
    if (document.getElementById('admin-dashboard-detail')) {
        adminNotes = document.getElementById('adminNotes').value;
        model3DFile = document.getElementById('adminModelFile').files[0]; // 🎯 ดึงไฟล์จาก File Input ใหม่
    } 
    
    const message = document.getElementById('detailMessage') || document.getElementById('dashboardMessage');

    if (!confirm (`Are you sure you want to ${status} Product ID ${productId}?`)) {
        return;
    }

    // 1. ตรวจสอบไฟล์ 3D สำหรับการอนุมัติ (เฉพาะหน้า Detail)
    if (status === 'approved' && !model3DFile && document.getElementById('admin-dashboard-detail')) {
        alert("3D Model File is required for approval.");
        return;
    }

    message.textContent = `Processing Product ID ${productId}...`;
    message.style.color = 'orange';

    console.log("Debug: Raw Product ID:", productId);
    console.log("Debug: Parsed Product ID:", parseInt(productId));

    // 2. สร้าง FormData เพื่อส่งไฟล์และข้อมูล
    const formData = new FormData();
    formData.append("product_id", parseInt(productId));
    formData.append("status", status);
    formData.append("admin_notes", adminNotes);
    
    if (model3DFile) {
        // ส่งไฟล์ 3D ที่เลือก
        formData.append("model_3d_file", model3DFile); 
    }
    
    // 3. ยิง Request POST
    try {
        const response = await fetch(`${BASE_API_URL}admin/approve_product.php`, {
            method: 'POST',
            body: formData // ส่ง FormData เพื่อรองรับไฟล์
        });

        const result = await response.json();

        if (result.success) {
            message.textContent = `Product ID ${productId} status updated to ${status} successfully.`;
            message.style.color = 'green';
            
            // นำกลับไปหน้า Queue หลังจากอนุมัติ/ปฏิเสธจากหน้า Detail
            if (document.getElementById('admin-dashboard-detail')) {
                 setTimeout(() => {
                    window.location.href = 'admin_home.html'; 
                 }, 1000);
            } else {
                // ถ้าเรียกจากหน้า Queue เดิม ให้โหลดรายการใหม่
                loadPendingProducts();
            }

        } else {
            message.textContent = `Error processing: ${result.message}`;
            message.style.color = 'red';
        }

    } catch (error) {
        message.textContent = 'Network Error during approval process.';
        console.error('Approval Error:', error);
    }
}


// ================= การเรียกใช้ฟังก์ชันเริ่มต้น (window.onload) =================

window.onload = function() {
    // Logic สำหรับหน้า Login (index.html)
    if (document.getElementById('loginForm')) { 
        checkLoginAdmin(); 
    }
    
    // Logic สำหรับหน้า Dashboard (admin_home.html)
    if (document.getElementById('admin-dashboard')) {
        checkAuthAdmin(); 
        loadPendingProducts();
    }
    
    // Logic สำหรับหน้า Product Detail (admin_product_detail.html)
    if (document.getElementById('admin-dashboard-detail')) {
        checkAuthAdmin(); 
        loadAdminProductDetail();
    }
};