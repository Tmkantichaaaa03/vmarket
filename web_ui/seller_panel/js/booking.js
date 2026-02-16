document.addEventListener("DOMContentLoaded", function () {

    if (typeof checkAuth === "function") {
        checkAuth();
    }

    loadStalls();
});

async function loadStalls() {
    try {
        const response = await fetch(BASE_API_URL + "seller/get_stalls.php");
        const data = await response.json();

        const topRow = document.getElementById("topRow");
        const bottomRow = document.getElementById("bottomRow");

        if (!topRow || !bottomRow) {
            console.error("หา topRow หรือ bottomRow ไม่เจอ");
            return;
        }

        topRow.innerHTML = "";
        bottomRow.innerHTML = "";

        data.forEach(stall => {
            const card = document.createElement("div");
            card.classList.add("stall-card");

            card.innerHTML = `
                <h4>พื้นที่ร้านค้า หมายเลข ${stall.stall_number}</h4>
                <p>สถานะ: ${stall.status === 'available' ? 'ว่าง' : 'ถูกจองแล้ว'}</p>
                <button 
                    ${stall.status === 'booked' ? 'disabled' : ''} 
                    onclick="bookStall(${stall.stall_id})">
                    ${stall.status === 'available' ? 'ดำเนินการจองพื้นที่' : 'ไม่สามารถจองได้'}
                </button>
            `;

            if (stall.zone === "top") {
                topRow.appendChild(card);
            } else {
                bottomRow.appendChild(card);
            }
        });

    } catch (error) {
        console.error("โหลดพื้นที่ร้านค้าไม่สำเร็จ:", error);
    }
}


async function bookStall(stallId) {

    const sellerId = sessionStorage.getItem("seller_id");

    if (!sellerId) {
        Swal.fire({
            icon: "warning",
            title: "กรุณาเข้าสู่ระบบก่อน"
        });
        return;
    }

    const confirm = await Swal.fire({
        title: "ยืนยันการจองพื้นที่?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก"
    });

    if (!confirm.isConfirmed) return;

    try {
        const response = await fetch(BASE_API_URL + "seller/book_stall.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                stall_id: stallId,
                seller_id: sellerId
            })
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire("สำเร็จ", "จองพื้นที่เรียบร้อยแล้ว", "success");
            loadStalls();
        } else {
            Swal.fire("ผิดพลาด", result.message, "error");
        }

    } catch (error) {
        Swal.fire("ผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
    }
}
