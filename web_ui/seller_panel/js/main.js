const BASE_API_URL = 'http://localhost/vmarket/api/'; //กำหนด url ฐานของ api ทั้งหมด
const sellerId = sessionStorage.getItem('seller_id'); //ใช้ระบุตัวตน seller ตอนเรียก api
const shopName = sessionStorage.getItem('shop_name'); //ดึงชื่อร้านมาแสดงผล

//ตรวจสอบว่า login หรือยัง
function checkAuth() {
    if (!sellerId) { 
        alert('You must be logged in to access the dashboard.');
        window.location.href = 'index.html'; 
    }
}

//แสดงชื่อร้านใน element ที่มี id เป็น shopNameDisplay
function displayShopName() { 
    const shopNameElement = document.getElementById('shopNameDisplay'); 
    if (shopNameElement && shopName) {
        shopNameElement.textContent = shopName;
    }
}

function logout() {
    sessionStorage.removeItem('seller_id');
    sessionStorage.removeItem('shop_name');
    window.location.href = 'index.html';
}

window.onload = function() {
    checkAuth();        //ตรวจสอบสิทธิ์การเข้าถึงทุกครั้ง
    displayShopName();  

    // Logic การเรียกใช้ฟังก์ชันตามหน้าเว็บ:
    // ถ้าเราอยู่ในหน้า products.html (มีตารางนี้)
    if (document.querySelector('#productListTable tbody')) {
        loadSellerProducts();
    }

    // ถ้าเราอยู่ในหน้า add_product.html (มีฟอร์มนี้)
    if (document.getElementById('addProductForm')) {
        setupAddProductListener();
    }
};


// ============== products.html ไว้ดึงและแสดงรายการสินค้า ===============

async function loadSellerProducts() {

    //ดึง Element HTML ที่เกี่ยวข้องมาเตรียมใช้งาน
    const tableBody = document.querySelector('#productListTable tbody');
    const message = document.getElementById('productMessage');

    //status Loading
    tableBody.innerHTML = '<tr><td colspan="6">Loading loadSellerProducts...</td></tr>';
    message.textContent = '';

    try {

        //ยิง Request GET ไปหา API
        const response = await fetch(`${BASE_API_URL}seller/get_seller_products.php?seller_id=${sellerId}`, {
            method: 'GET'
        });

        //แปลงข้อมูล JSON ที่ได้จาก API
        const result = await response.json();

        //เคลียร์ข้อความ Loading
        tableBody.innerHTML = '';

        if (result.success && result.data.length > 0) {

            //ถ้าสำเร็จและมีข้อมูล
            result.data.forEach(product => {
                const row = tableBody.insertRow();  //สร้างแถวใหม่ในตาราง

                //ใส่ข้อมูลแต่ละคอลัมน์จาก JSON ที่ได้รับ
                row.insertCell().textContent = product.product_id;
                row.insertCell().textContent = product.name;
                row.insertCell().textContent = product.price;
                row.insertCell().textContent = product.stock;

                //จัดการสีตามสถานะการอนุมัติ
                const statusCell = row.insertCell();

                statusCell.textContent = product.approval_status;

                if (product.approval_status === 'approved') {
                    statusCell.style.color = 'green';
                } else if (product.approval_status === 'rejected') {
                    statusCell.style.color = 'red';
                } else {
                    statusCell.style.color = 'orange';  //สถานะ pending
                }

                //ใส่ปุ่ม actoin
                row.insertCell().innerHTML = `
                    <a href="product_detail.html?id=${product.product_id}" style="padding: 5px; text-decoration: none;">View Detail</a>`;
                        
            });

        } else if (response.status === 404) {
            //ถ้า API ตอบกลับ 404 (ไม่พบสินค้า)
            message.textContent = 'You have not listed any product yet.';
            tableBody.innerHTML = '<tr><td colspan="6">No product found.</td></tr>';
        } else {
            //จัดการข้อผิดพลาดอื่นๆ ที่ API ส่งมา
            message.textContent = 'Error fetching products: ' + result.message;
        
        }

    } catch (error) {
        //จัดการข้อผิดพลาดระดับเครือข่าย (เช่น XAMPP ไม่ทำงาน)
        console.error('Fetch Error:', error);
        message.textContent = 'Network or server error occurred. Check XAMPP.';
        tableBody.innerHTML = '<tr><td colspan="6">Error connecting to server.</td></tr>';
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

        // 5. จัดการไฟล์ 3D (Optional)
        const model3DFile = document.getElementById("model3DFile").files[0];
        if (model3DFile) {
            formData.append("model_3d_file", model3DFile);
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
                messageBox.style.color = "green";
                messageBox.innerText = `Product added successfully! Files uploaded. ID: ${result.product_id}`;
                form.reset();
            } else {
                messageBox.style.color = "red";
                messageBox.innerText = result.message || "Error adding product.";
            }

        } catch (error) {
            console.error('Submission Error:', error);
            messageBox.textContent = 'Network or server error occurred during file upload.';
            messageBox.style.color = 'red';
        }
    });
}


// ================ product_detail.html ไว้แสดงรายละเอียดสินค้า =================


async function loadProductDetail() {
    const detailContainer = document.getElementById('productDetailContainer');
    const message = document.getElementById('detailMessage');
    
    // ดึง Product ID จาก URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        message.textContent = 'Error: Product ID is missing in URL.';
        message.style.color = 'red';
        return;
    }

    message.textContent = `Loading details for Product ID ${productId}...`;
    message.style.color = 'orange';

    try {
        // เรียก API get_products.php โดยส่ง product_id ไป
        // (เราสมมติว่า API get_products.php รองรับการรับ ID เดี่ยวผ่าน Query Parameter)
        const response = await fetch(`${BASE_API_URL}products/get_products.php?product_id=${productId}`, {
            method: 'GET'
        });

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            const product = result.data[0]; // ดึงข้อมูลสินค้าชิ้นแรก

            // แสดงผลข้อมูลใน Element ต่างๆ
            document.getElementById('productName').textContent = product.name;
            document.getElementById('detailProductId').textContent = product.product_id;
            document.getElementById('detailDescription').textContent = product.description;
            document.getElementById('detailPrice').textContent = parseFloat(product.price).toFixed(2);
            document.getElementById('detailStock').textContent = product.stock;
            document.getElementById('detailImage').textContent = product.image;
            document.getElementById('detailModel3D').textContent = product.model_3d;
            
            // จัดการ Status
            const statusElement = document.getElementById('detailApprovalStatus');
            statusElement.textContent = product.approval_status;
            statusElement.className = 'status-' + product.approval_status;
            
            // แสดงรูปภาพ (ถ้ามี URL รูปภาพ)
            const imgElement = document.getElementById('productImage');
            if (product.image) {
                // สมมติว่าไฟล์ภาพอยู่ในโฟลเดอร์ assets/images/
                imgElement.src = `../assets/images/${product.image}`; 
                imgElement.style.display = 'block';
            }

            message.textContent = 'Details loaded successfully.';
            message.style.color = 'green';
            
        } else {
            message.textContent = 'Error: Product data not found or API failed.';
            message.style.color = 'red';
        }

    } catch (error) {
        console.error('Fetch Error:', error);
        message.textContent = 'Network error occurred while fetching details.';
        message.style.color = 'red';
    }
}


