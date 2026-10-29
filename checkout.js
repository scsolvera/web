// Ambil data keranjang dari localStorage yang dikirim dari index.html
const cart = JSON.parse(localStorage.getItem('solveraCart')) || [];
const checkoutItemsList = document.getElementById('checkoutItemsList');
const checkoutTotalPrice = document.getElementById('checkoutTotalPrice');
const shippingRadios = document.querySelectorAll('input[name="shippingMethod"]');
const addressGroup = document.getElementById('addressGroup');
const buyerNameInput = document.getElementById('buyerName');
const buyerAddressInput = document.getElementById('buyerAddress');
const sendWhatsAppBtn = document.getElementById('sendWhatsAppBtn');

let totalPrice = 0;

// 1. Tampilkan rincian barang
function renderCheckoutSummary() {
    checkoutItemsList.innerHTML = '';
    totalPrice = 0;

    if (cart.length === 0) {
        checkoutItemsList.innerHTML = '<p>Keranjang kosong. <a href="index.html">Belanja dulu yuk!</a></p>';
        return;
    }

    cart.forEach(item => {
        // PERBAIKAN: Menggunakan item.quantity (sesuai script utama)
        const qty = item.quantity || item.qty || 1;
        const itemTotal = item.price * qty;
        totalPrice += itemTotal;

        const row = document.createElement('div');
        row.classList.add('checkout-item-row');
        row.innerHTML = `
            <span>${item.name} (${item.type ? item.type + ', ' : ''}${qty}x)</span>
            <strong>Rp ${itemTotal.toLocaleString('id-ID')}</strong>
        `;
        checkoutItemsList.appendChild(row);
    });

    checkoutTotalPrice.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
}

renderCheckoutSummary();

// 2. Munculkan kolom alamat hanya jika opsi "Diantar" dipilih
shippingRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'Diantar ke Rumah') {
            addressGroup.style.display = 'block';
        } else {
            addressGroup.style.display = 'none';
        }
    });
});

// 3. Tombol Kirim ke WhatsApp dengan Format Teks Otomatis
sendWhatsAppBtn.addEventListener('click', () => {
    const name = buyerNameInput.value.trim();
    const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked').value;
    const address = buyerAddressInput.value.trim();

    if (!name) {
        alert('Mohon masukkan nama penerima terlebih dahulu!');
        buyerNameInput.focus();
        return;
    }

    if (shippingMethod === 'Diantar ke Rumah' && !address) {
        alert('Karena memilih diantar, mohon masukkan alamat lengkap kamu!');
        buyerAddressInput.focus();
        return;
    }

    // Susun daftar barang untuk teks WhatsApp (termasuk varian tipe & quantity yang benar)
    let productDetailsText = '';
    cart.forEach((item) => {
        const qty = item.quantity || item.qty || 1;
        productDetailsText += `\n- ${item.name} (${item.type ? 'Tipe: ' + item.type + ', ' : ''}${qty} pcs) - Rp ${(item.price * qty).toLocaleString('id-ID')}`;
    });

    // Susun informasi pengiriman
    let shippingInfoText = `Metode: *${shippingMethod}*`;
    if (shippingMethod === 'Diantar ke Rumah') {
        shippingInfoText += `\nAlamat Pengiriman: ${address}`;
    }

    // Buat template pesan WhatsApp
    const message = `Halo kak, saya *${name}* ingin membeli produk berikut:${productDetailsText}\n\nTotal Harga: *Rp ${totalPrice.toLocaleString('id-ID')}*\n${shippingInfoText}\n\nMohon konfirmasinya ya kak. Terima kasih!`;

    // Nomor WhatsApp Perusahaan Solvèra
    const companyWhatsAppNumber = '6285659766900'; 

    // Encode teks agar aman dibaca URL browser
    const encodedMessage = encodeURIComponent(message);

    // Buka WhatsApp Web / Aplikasi WhatsApp otomatis
    window.open(`https://wa.me/${companyWhatsAppNumber}?text=${encodedMessage}`, '_blank');
});