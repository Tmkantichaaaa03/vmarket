
const sellerId = sessionStorage.getItem('seller_id'); //ใช้ระบุตัวตน seller ตอนเรียก api
const shopName = sessionStorage.getItem('shop_name'); //ดึงชื่อร้านมาแสดงผล
let currentOrderId = null;

//ตรวจสอบว่า login หรือยัง
function checkAuth() {
    if (!sellerId) { 
        alert('You must be logged in to access the dashboard.');
        window.location.href = 'index.html'; 
    }
}

// ปรับฟังก์ชันใน main.js ให้เหลือเฉพาะการอัปเดต Navbar
async function displayShopName() { 
    let shopName = sessionStorage.getItem('shop_name');
    const sellerId = sessionStorage.getItem('seller_id');
    const navShopNameElement = document.getElementById('navShopName');

    if ((!shopName || shopName === "null") && sellerId) {
        try {
            const response = await fetch(`${BASE_API_URL}seller/get_profile.php?seller_id=${sellerId}`);
            const result = await response.json();
            if (result.success && result.data.shop_name) {
                shopName = result.data.shop_name;
                sessionStorage.setItem('shop_name', shopName);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    const finalName = shopName && shopName !== "null" ? shopName : "ร้านค้าของฉัน";
    if (navShopNameElement) {
        navShopNameElement.textContent = finalName;
    }
    // ลบส่วนที่อัปเดต shopNameDisplay ออกได้เลย
}

function logout() {
    sessionStorage.removeItem('seller_id');
    sessionStorage.removeItem('shop_name');
    window.location.href = 'index.html';
}

// ฟังก์ชันดึงการแจ้งเตือนจาก Server

async function fetchNotifications() {
    if (!sellerId) return;
    try {
        const response = await fetch(`${BASE_API_URL}seller/get_notifications.php?seller_id=${sellerId}`);
        const result = await response.json();

        if (result.success) {
            // แสดง/ซ่อนตัวเลขแจ้งเตือน
            const countBadge = document.getElementById('notiCount');
            if (countBadge) {
                if (result.unread_count > 0) {
                    countBadge.textContent = result.unread_count;
                    countBadge.style.display = 'block';
                } else {
                    countBadge.style.display = 'none';
                }
            }
            // ส่งข้อมูลไปวาดรายการแจ้งเตือน
            displayNotifications(result.data);
        }
    } catch (error) {
        console.error('Fetch Noti Error:', error);
    }
}

// ฟังก์ชันวาดรายการแจ้งเตือน (ใช้ div เพื่อคุมลำดับการคลิก)
function displayNotifications(data) {
    const notiList = document.getElementById('notiList');
    if (!notiList) return;

    if (data && data.length > 0) {
        notiList.innerHTML = data.map(item => `
            <div class="noti-item ${item.is_read == 0 ? 'unread' : ''}" 
                 /* ตรวจสอบบรรทัดนี้: ต้องส่ง item.id และ item.link */
                 onclick="goToNotification(${item.id}, '${item.link}')"> 
                <strong>${item.title}</strong>
                <p>${item.message}</p>
                <small>${item.created_at}</small>
            </div>
        `).join('');
    } else {
        notiList.innerHTML = '<p class="empty-noti">ไม่มีการแจ้งเตือน</p>';
    }
}

// ฟังก์ชันกดแจ้งเตือน (บันทึกว่าอ่านแล้ว -> เปลี่ยนหน้า)
async function goToNotification(notiId, link) {
    try {
        // บอก Server ว่าอ่านแล้ว (ไม่ต้องรอ response นานก็ได้)
        fetch(`${BASE_API_URL}seller/mark_read.php?id=${notiId}`);
        
        // เปลี่ยนหน้าทันทีไปยังหน้าที่แจ้งเตือนระบุไว้
        window.location.href = link;
    } catch (error) {
        console.error('Error marking as read:', error);
        window.location.href = link;
    }
}

window.onload = function() {
    checkAuth();         // ตรวจสอบ Login
    displayShopName();   // แสดงชื่อร้าน
    fetchNotifications(); // โหลดแจ้งเตือน
    
    // ตั้งเวลาโหลดแจ้งเตือนใหม่ทุก 1 นาที
    setInterval(fetchNotifications, 60000);

    // --- จุดสำคัญ: ตรวจสอบหน้า Analytics ---
    if (document.getElementById('salesTrendChart')) {
        console.log("Analytics Page Detected: Fetching Data..."); // ใส่ไว้เช็คใน Console
        fetchAnalyticsData();
    }

    // เช็คหน้าจัดการสินค้า
    if (document.querySelector('#productListTable tbody')) {
        loadSellerProducts();
    }
    
    // หน้าโปรไฟล์ร้าน
    if (document.getElementById('shopProfileForm')) {
        loadShopProfile();
        setupShopProfileListener();
    }

    // หน้าออเดอร์
    if (document.getElementById('orderList')) {
        loadSellerOrders();
    }
};
// ============== products.html ไว้ดึงและแสดงรายการสินค้า ===============

async function loadSellerProducts() {

    const grid = document.getElementById('productGrid');
    const message = document.getElementById('productMessage');

    if (!grid) return;

    grid.innerHTML = '<p>Loading products...</p>';
    message.textContent = '';

    try {
        const response = await fetch(`${BASE_API_URL}seller/get_seller_products.php?seller_id=${sellerId}`);
        const result = await response.json();

        grid.innerHTML = '';

        if (result.success && result.data.length > 0) {

            result.data.forEach(product => {

                // กำหนด class สีตามสถานะ
                let statusClass = 'pending';
                if (product.approval_status === 'approved') {
                    statusClass = 'approved';
                } else if (product.approval_status === 'rejected') {
                    statusClass = 'rejected';
                }

                const imagePath = product.image 
                    ? `assets/images/${product.image}` // ใช้ชื่อตาม DB ตรงๆ (แต่ใน DB ต้องมี .png หรือ .jpg ด้วยนะ)
                    : `assets/images/no-image.jpg`;

                grid.innerHTML += `
                    <div class="product-card"
                         onclick="location.href='product_detail.html?id=${product.product_id}'"
                         style="cursor:pointer;">

                        <img src="${imagePath}" alt="${product.name}">

                        <div class="product-card-content">
                            <h4>${product.name}</h4>
                            <div class="product-price">฿${parseFloat(product.price).toLocaleString()}</div>
                            <div class="product-stock">Stock: ${product.stock}</div>

                            <div class="product-status ${statusClass}">
                                ${product.approval_status}
                            </div>
                        </div>
                    </div>
                `;
            });

        } else {
            grid.innerHTML = '';
            message.textContent = 'ยังไม่มีสินค้าในร้านของคุณ';
        }

    } catch (error) {
        console.error('Fetch Error:', error);
        grid.innerHTML = '';
        message.textContent = 'เกิดข้อผิดพลาดในการโหลดสินค้า';
    }
}



// ============== add_product.html ================

// ตั้งค่า Listener เมื่อ Form ถูกส่ง
// ใน main.js
function setupAddProductListener() {
    const form = document.getElementById("addProductForm");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const currentSellerId = sessionStorage.getItem('seller_id'); 

        if (!currentSellerId) {
            // ... (Error message) ...
            return;
        }

        const messageBox = document.getElementById("addProductMessage");
        messageBox.textContent = 'Uploading files and submitting product...';
        messageBox.style.color = 'orange';

        // 1. สร้าง FormData เพื่อจัดการการส่งไฟล์
        const formData = new FormData();
        formData.append("seller_id", currentSellerId); // ส่ง seller_id เป็น form field

        // 2. ข้อมูลสินค้าทั่วไป
        formData.append("product_name", document.getElementById("productName").value);
        formData.append("description", document.getElementById("productDescription").value);
        formData.append("price", document.getElementById("productPrice").value);
        formData.append("stock", document.getElementById("productStock").value);

        // 3. จัดการไฟล์รูปปก (Cover Image)
        const coverFile = document.getElementById("coverImage").files[0];
        if (coverFile) {
            formData.append("cover_image", coverFile);
        } else {
            messageBox.textContent = "Error: Cover Image is required.";
            messageBox.style.color = "red";
            return;
        }

        // 4. จัดการไฟล์รูปลายละเอียด (Detail Images - รองรับหลายไฟล์)
        const detailFiles = document.getElementById("detailImages").files;
        if (detailFiles.length > 0) {
            for (let i = 0; i < detailFiles.length; i++) {
                formData.append("detail_images[]", detailFiles[i]); // ใช้ array [] ใน key
            }
        }

        // 6. ยิง Request POST (FormData ไม่ต้องใส่ Content-Type: application/json)
        try {
            const response = await fetch(`${BASE_API_URL}products/add_product.php`, {
                method: "POST",
                body: formData // ส่ง FormData โดยตรง
            });

            const result = await response.json();

            // ... (Logic การแสดงผลสำเร็จ/ไม่สำเร็จเดิม) ...
if (result.success) {

    Swal.fire({
        toast: true,
        position: 'top-end',
        html: `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="assets/images/check.png" style="width:20px; height:20px;">
                <span style="font-size:14px;">
                    บันทึกสินค้าเรียบร้อยแล้ว
                </span>
            </div>
        `,
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
        background: '#ffffff',
        color: '#3e342d',
        customClass: { popup: 'vm-toast' }
    }).then(() => {
        window.location.href = "dashboard.html";
    });

} else {

    Swal.fire({
        toast: true,
        position: 'top-end',
        html: `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="assets/images/cancel.png" style="width:20px; height:20px;">
                <span style="font-size:14px;">
                    ไม่สามารถบันทึกสินค้าได้
                </span>
            </div>
        `,
        showConfirmButton: false,
        timer: 2000,
        background: '#ffffff'
    });

}


        } catch (error) {
            console.error('Submission Error:', error);
            messageBox.textContent = 'Network or server error occurred during file upload.';
            messageBox.style.color = 'red';
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("addProductForm")) {
        setupAddProductListener();
    }
});

// ================ product_detail.html ไว้แสดงรายละเอียดสินค้า =================
// ฟังก์ชันสลับโหมด
function toggleEditMode(isEdit) {
    document.getElementById('viewMode').style.display = isEdit ? 'none' : 'block';
    document.getElementById('editProductForm').style.display = isEdit ? 'block' : 'none';
    document.getElementById('editBtn').style.display = isEdit ? 'none' : 'inline-block';
    document.getElementById('cancelBtn').style.display = isEdit ? 'inline-block' : 'none';
}

// โหลดรายละเอียดสินค้าและใส่ข้อมูลลงในช่อง Input
async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) return;

    try {
        const response = await fetch(`${BASE_API_URL}products/get_products.php?product_id=${productId}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            const product = result.data[0];

            // อัปเดตข้อมูล View Mode
            document.getElementById('displayProductId').textContent = product.product_id;
            document.getElementById('viewName').textContent = product.name;
            document.getElementById('viewPrice').textContent = parseFloat(product.price).toLocaleString();
            document.getElementById('viewStock').textContent = product.stock;
            document.getElementById('viewDescription').textContent = product.description || 'ไม่มีรายละเอียดสินค้า';
            
            // ใส่ข้อมูลเดิมลงในโหมดแก้ไข (Input Value)
            document.getElementById('editName').value = product.name;
            document.getElementById('editPrice').value = product.price;
            document.getElementById('editStock').value = product.stock;
            document.getElementById('editDescription').value = product.description || '';

            // รูปภาพ
            document.getElementById('productImage').src = product.image ? `assets/images/${product.image}` : `assets/images/no-image.jpg`;
            const statusBadge = document.getElementById('detailApprovalStatus');
            statusBadge.textContent = product.approval_status;
            statusBadge.className = 'status-badge status-' + product.approval_status;

            loadAdditionalImages(productId);
        }
    } catch (error) { console.error('Error:', error); }
}

// โหลดรูปภาพประกอบ
async function loadAdditionalImages(productId) {
    const gallery = document.getElementById('imageGallery');
    const mainImage = document.getElementById('productImage');
    if (!gallery || !mainImage) return;

    gallery.innerHTML = '';

    try {
        const response = await fetch(`${BASE_API_URL}products/get_product_images.php?product_id=${productId}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {

            result.data.forEach(img => {
                const imgElement = document.createElement('img');
                imgElement.src = `assets/images/${img.image_url}`;
                imgElement.classList.add('thumbnail');

                imgElement.onclick = () => {

                    // เก็บรูปหลักปัจจุบันไว้
                    const currentMainSrc = mainImage.src;

                    // เปลี่ยนรูปหลักเป็นรูปที่กด
                    mainImage.src = imgElement.src;

                    // เอารูปหลักเดิมมาใส่แทนรูปเล็กที่กด
                    imgElement.src = currentMainSrc;
                };

                gallery.appendChild(imgElement);
            });

        } else {
            console.log("No additional images found.");
        }

    } catch (error) {
        console.error("Error loading images:", error);
    }
}


// จัดการการบันทึก
document.getElementById('editProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const productId = document.getElementById('displayProductId').textContent;

    const formData = new FormData();
    formData.append('product_id', productId);
    formData.append('name', document.getElementById('editName').value);
    formData.append('price', document.getElementById('editPrice').value);
    formData.append('stock', document.getElementById('editStock').value);
    formData.append('description', document.getElementById('editDescription').value);

    try {
        // ตรวจสอบ BASE_API_URL ให้มั่นใจว่าชี้ไปที่โฟลเดอร์ api/products/
        const response = await fetch(`${BASE_API_URL}products/update_product.php`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

if (result.success) {

    Swal.fire({
        toast: true,
        position: 'top-end',
        html: `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="assets/images/check.png"
                     style="width:20px; height:20px;">
                <span style="font-size:14px;">
                    บันทึกข้อมูลเรียบร้อยแล้ว
                </span>
            </div>
        `,
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        background: '#ffffff',
        color: '#3e342d',
        customClass: {
            popup: 'vm-toast'
        }
    }).then(() => {
        toggleEditMode(false);
        loadProductDetail();
    });
        } else {
            Swal.fire('ล้มเหลว', result.message, 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ ตรวจสอบ Path ของไฟล์ update_product.php', 'error');
    }
});
// ============== shop_profile.html ไว้ดึงและแก้ไขข้อมูลร้านค้า ===============

// ฟังก์ชันโหลดข้อมูลโปรไฟล์มาแสดง
async function loadShopProfile() {
    if (!sellerId) return;
    try {
        const response = await fetch(`${BASE_API_URL}seller/get_profile.php?seller_id=${sellerId}`);
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            // ใส่ข้อมูลลงในช่อง Input
            if(document.getElementById('shopName')) document.getElementById('shopName').value = data.shop_name || '';
            if(document.getElementById('shopPhone')) document.getElementById('shopPhone').value = data.phone_number || '';
            if(document.getElementById('shopAddress')) document.getElementById('shopAddress').value = data.address || '';
            if(document.getElementById('shopCity')) document.getElementById('shopCity').value = data.city || '';
            if(document.getElementById('shopPostalCode')) document.getElementById('shopPostalCode').value = data.postal_code || '';
            if(document.getElementById('shopDescription')) document.getElementById('shopDescription').value = data.description || '';
            
            // --- จุดแก้ไข: แก้ Path รูปภาพกลับเป็นแบบที่พี่เคยใช้แล้วขึ้นปกติ ---
            if (data.profile_image && document.getElementById('profilePreview')) {
                document.getElementById('profilePreview').src = `/vmarket/web_ui/seller_panel/assets/images/${data.profile_image}`;
            }
        }
    } catch (error) { 
        console.error('Load Profile Error:', error); 
    }
}

// ฟังก์ชันตั้งค่าการส่งข้อมูล (บันทึกข้อมูล)
function setupShopProfileListener() {
    const form = document.getElementById('shopProfileForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageBox = document.getElementById('profileMessage');
        if(messageBox) messageBox.textContent = 'กำลังบันทึกข้อมูล...';

        // ปลดล็อกชั่วคราวเพื่อให้ดึงค่าจากช่องที่ถูก disabled อยู่ได้
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => input.disabled = false);

        const formData = new FormData();
        formData.append('seller_id', sellerId);
        formData.append('shop_name', document.getElementById('shopName').value);
        formData.append('phone_number', document.getElementById('shopPhone').value);
        formData.append('address', document.getElementById('shopAddress').value);
        formData.append('city', document.getElementById('shopCity').value);
        formData.append('postal_code', document.getElementById('shopPostalCode').value);
        formData.append('description', document.getElementById('shopDescription').value);
        
        const imageFile = document.getElementById('shopImage').files[0];
        if (imageFile) {
            formData.append('profile_image', imageFile);
        }

        try {
            const response = await fetch(`${BASE_API_URL}seller/update_profile.php`, {
                method: 'POST',
                body: formData 
            });
            const result = await response.json();

            if (result.success) {
                alert('บันทึกข้อมูลเรียบร้อย!');
                sessionStorage.setItem('shop_name', document.getElementById('shopName').value);
                location.reload(); 
            } else {
                alert('ล้มเหลว: ' + result.message);
                // ถ้าพลาด ให้ล็อกช่องกลับเหมือนเดิม
                inputs.forEach(input => { if(input.id !== 'shopImage') input.disabled = true; });
            }
        } catch (error) {
            console.error('Update Error:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            inputs.forEach(input => { if(input.id !== 'shopImage') input.disabled = true; });
        }
    });
}

// เรียกใช้งานทันที
setupShopProfileListener();


// ================== orders.js ==================

document.addEventListener("DOMContentLoaded", () => {
    loadSellerOrders();
});

// ================== โหลดรายการคำสั่งซื้อ ==================
async function loadSellerOrders() {
    const orderList = document.getElementById('orderList');
    if (!orderList) return;

    try {
        const response = await fetch(
            `${BASE_API_URL}seller/get_seller_orders.php?seller_id=${sellerId}`
        );

        const result = await response.json();

        if (result.success) {

            orderList.innerHTML = result.data.map(order => {

let statusText = order.status || "";
let statusClass = "status-pending";

const statusValue = (order.status || "").trim();

if (statusValue.includes("รอ")) {
    statusClass = "status-pending";

} else if (statusValue.includes("กำลัง")) {
    statusClass = "status-shipping";

} else if (statusValue.includes("สำเร็จ")) {
    statusClass = "status-completed";

} else if (statusValue.includes("ยกเลิก")) {
    statusClass = "status-cancelled";
}




                return `
                <tr class="order-row"
                    onclick="viewDetails(${order.order_id})"
                    style="cursor:pointer;">

                    <td>#${order.order_id}</td>
                    <td>${new Date(order.created_at).toLocaleString('th-TH')}</td>
                    <td>${order.total_items_count} รายการ</td>
                    <td>${parseFloat(order.total_amount).toLocaleString()} บาท</td>

                    <!-- สถานะออเดอร์ -->
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${statusText}
                        </span>
                    </td>

                    <!-- ✅ สถานะการชำระเงิน -->
                    <td>
                        ${order.payment_status === 'paid' 
                            ? '<span class="pay-paid">ชำระแล้ว</span>' 
                            : '<span class="pay-cod">ปลายทาง</span>'}
                    </td>

                    <!-- ปุ่มดู -->
                    <td class="arrow-cell">
                        <img src="assets/images/next.png" class="arrow-icon">
                    </td>

                </tr>
                `;


            }).join('');

        } else {
            orderList.innerHTML =
                `<tr><td colspan="6" style="text-align:center;">${result.message}</td></tr>`;
        }

    } catch (error) {
        console.error("โหลดออเดอร์ผิดพลาด:", error);
    }
}


function closeDetailPanel() {

    document.getElementById("orderDetailPanel")
        .classList.remove("open");

    document.querySelector(".order-layout")
        .classList.remove("shift");
}


window.updateOrderStatus = async function(status) {

    if (!currentOrderId) return;

    const cleanStatus = (status || "").toLowerCase().trim();

    /* =========================
       เตือนก่อน "ยกเลิก"
    ========================== */
    if (cleanStatus === "cancelled") {

        const confirmCancel = await Swal.fire({
            title: "ยืนยันการยกเลิกคำสั่งซื้อ",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ปิด",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#b0a79f",
            reverseButtons: true
        });

        if (!confirmCancel.isConfirmed) return;
    }

    /* =========================
       เตือนก่อน "จัดส่งสำเร็จ"
    ========================== */
    if (cleanStatus === "completed") {

        const confirmShip = await Swal.fire({
            title: "ยืนยันว่าจัดส่งสินค้าเรียบร้อยแล้ว",
            text: "เมื่อยืนยันแล้วจะไม่สามารถย้อนกลับได้",
            icon: "success",
            showCancelButton: true,
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ปิด",
            confirmButtonColor: "#4CAF50",
            cancelButtonColor: "#b0a79f",
            reverseButtons: true
        });

        if (!confirmShip.isConfirmed) return;
    }

    /* =========================
       ตรงนี้คือจุดที่ต้องวาง try
    ========================== */
    try {

        const response = await fetch(
            `${BASE_API_URL}orders/update_order_status.php`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: currentOrderId,
                    status: cleanStatus
                })
            }
        );

        const result = await response.json();

if (result.success) {

    // ปิด toast เก่าทันที (กันค้าง)
    Swal.close();

    // ใช้ SweetAlert2 mixin สำหรับ toast
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: "success",
        title: "อัปเดตสถานะเรียบร้อยแล้ว"
    });

    loadSellerOrders();

}
 else {

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: result.message,
                showConfirmButton: false,
                timer: 2000
            });

        }

    } catch (err) {

        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
            showConfirmButton: false,
            timer: 2000
        });

    }
};




// ================ analytics.html (Sales Analytics) ================

async function fetchAnalyticsData() {
    const sId = sessionStorage.getItem('seller_id');
    if (!sId) return;

    // แสดงสถานะกำลังโหลด (ถ้ามี Element นี้ในหน้า HTML)
    const chartLoading = document.getElementById('chartLoading');
    if (chartLoading) chartLoading.style.display = 'block';

    try {
        // ดึงข้อมูลจาก API โดยส่ง seller_id ไปแบบ GET
        const response = await fetch(`${BASE_API_URL}seller/get_sales_stats.php?seller_id=${sId}`);
        const result = await response.json();

        if (result.status === 'success') {
            updateAnalyticsUI(result);
        } else {
            console.error('API Error:', result.message);
            // กรณีไม่มีข้อมูล หรือ error ให้เคลียร์หน้าจอเป็น 0
            clearAnalyticsUI();
        }
    } catch (error) {
        console.error('Fetch Analytics Error:', error);
    } finally {
        if (chartLoading) chartLoading.style.display = 'none';
    }
}

/**
 * ฟังก์ชันวาดกราฟและอัปเดตตัวเลขบนหน้าเว็บ
 */
function updateAnalyticsUI(data) {
    // 1. อัปเดตตัวเลขสรุป (ยอดขายวันนี้ / ออเดอร์ทั้งหมด)
    const todaySalesEl = document.getElementById('todaySales');
    const totalOrdersEl = document.getElementById('totalOrders');
    
    if (todaySalesEl) {
        todaySalesEl.innerText = `฿${parseFloat(data.today_revenue).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }
    if (totalOrdersEl) {
        totalOrdersEl.innerText = data.total_orders.toLocaleString();
    }

    // 2. จัดการวาดกราฟเส้น (Trend Chart)
    const ctx = document.getElementById('salesTrendChart');
    if (ctx) {
        // ป้องกันกราฟซ้อนกันเมื่อมีการโหลดใหม่
        if (window.mySalesChart instanceof Chart) {
            window.mySalesChart.destroy();
        }

        window.mySalesChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: data.chart_labels, // อาร์เรย์ของวันที่ เช่น ['01 Feb', '02 Feb']
                datasets: [{
                    label: 'ยอดขายรายวัน',
                    data: data.chart_data, // อาร์เรย์ของยอดเงิน
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.05)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointHitRadius: 10,
                    borderWidth: 2
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return '฿' + value.toLocaleString(); }
                        }
                    }
                }
            }
        });
    }

    // 3. แสดงรายการสินค้าขายดี 5 อันดับแรก
    const productList = document.getElementById('topProductsList');
    if (productList) {
        if (data.top_products && data.top_products.length > 0) {
            productList.innerHTML = data.top_products.map((p, index) => `
                <div class="d-flex align-items-center mb-3 p-2 border-bottom">
                    <div class="me-3 fw-bold text-primary" style="width: 25px;">${index + 1}</div>
                    <div class="flex-grow-1">
                        <div class="small fw-bold text-dark">${p.name}</div>
                        <div class="text-muted" style="font-size: 0.7rem;">ขายไปแล้ว ${p.total_sold} ชิ้น</div>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold text-primary" style="font-size: 0.9rem;">฿${parseFloat(p.revenue).toLocaleString()}</div>
                    </div>
                </div>
            `).join('');
        } else {
            productList.innerHTML = '<p class="text-center text-muted py-3">ไม่มีข้อมูลการขายในขณะนี้</p>';
        }
    }
}


 // ฟังก์ชันล้าง UI กรณีไม่มีข้อมูล
function clearAnalyticsUI() {
    if (document.getElementById('todaySales')) document.getElementById('todaySales').innerText = '฿0.00';
    if (document.getElementById('totalOrders')) document.getElementById('totalOrders').innerText = '0';
    if (document.getElementById('topProductsList')) document.getElementById('topProductsList').innerHTML = '<p class="text-center text-muted py-3">ไม่มีข้อมูล</p>';
}

async function deleteProduct(productId) {

    if (!productId) return;

    try {

        const response = await fetch(`${BASE_API_URL}products/delete_product.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId })
        });

        const result = await response.json();

        if (result.success) {

            Swal.fire({
                toast: true,
                position: 'top-end',
                html: `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="assets/images/check.png"
                             style="width:20px; height:20px;">
                        <span style="font-size:14px;">
                            ลบสินค้าเรียบร้อยแล้ว
                        </span>
                    </div>
                `,
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
                background: '#ffffff',
                color: '#3e342d',
                customClass: {
                    popup: 'vm-toast'
                }
            }).then(() => {
                window.location.href = "dashboard.html";
            });

        } else {

            Swal.fire({
                toast: true,
                position: 'top-end',
                html: `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="assets/images/cancel.png"
                             style="width:20px; height:20px;">
                        <span style="font-size:14px;">
                            ลบสินค้าไม่สำเร็จ
                        </span>
                    </div>
                `,
                showConfirmButton: false,
                timer: 1500,
                background: '#ffffff',
                color: '#3e342d'
            });

        }

    } catch (error) {
        console.error(error);
    }
}

