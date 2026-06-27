// ==================== GPS ATTENDANCE SYSTEM ====================

class AttendanceSystem {
    constructor() {
        this.currentLocation = null;
        this.map = null;
        this.marker = null;
        this.checkInTime = null;
        this.checkOutTime = null;
        this.attendanceHistory = this.loadHistory();
        this.apiEndpoint = 'http://localhost:5000/api'; // Backend URL
        
        this.init();
    }

    init() {
        this.setupMap();
        this.attachEventListeners();
        this.restoreFormData();
        this.displayHistory();
    }

    // ==================== MAP SETUP ====================

    setupMap() {
        // ตั้งค่า Leaflet Map ตำแหน่งเริ่มต้นที่ Thailand
        this.map = L.map('map').setView([13.7563, 100.5018], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(this.map);
    }

    // ==================== GPS FUNCTIONS ====================

    getLocation() {
        const btn = document.getElementById('getLocationBtn');
        btn.disabled = true;
        btn.innerHTML = '⏳ กำลังรับตำแหน่ง...';

        if (!navigator.geolocation) {
            this.showStatus('❌ เบราว์เซอร์ของคุณไม่รองรับ Geolocation', 'error');
            btn.disabled = false;
            btn.innerHTML = '📍 รับตำแหน่ง GPS';
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => this.handleLocationSuccess(position),
            (error) => this.handleLocationError(error),
            options
        );
    }

    handleLocationSuccess(position) {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = new Date().toLocaleString('th-TH');

        this.currentLocation = { latitude, longitude, accuracy, timestamp };

        // อัปเดต UI
        document.getElementById('latitude').textContent = latitude.toFixed(6);
        document.getElementById('longitude').textContent = longitude.toFixed(6);
        document.getElementById('accuracy').textContent = accuracy.toFixed(0);
        document.getElementById('timestamp').textContent = timestamp;

        // อัปเดต Map
        this.updateMap(latitude, longitude);

        // เปิดใช้งาน Check-in/Check-out buttons
        document.getElementById('checkInBtn').disabled = false;
        document.getElementById('checkOutBtn').disabled = false;

        this.showStatus('✅ ได้รับตำแหน่ง GPS สำเร็จ', 'success');

        // คืนสภาพปุ่ม
        const btn = document.getElementById('getLocationBtn');
        btn.disabled = false;
        btn.innerHTML = '📍 รับตำแหน่ง GPS';
    }

    handleLocationError(error) {
        const btn = document.getElementById('getLocationBtn');
        btn.disabled = false;
        btn.innerHTML = '📍 รับตำแหน่ง GPS';

        let errorMsg = '';
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMsg = '❌ การอนุญาตถูกปฏิเสธ โปรดอนุญาต GPS';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMsg = '❌ ไม่สามารถรับตำแหน่ง GPS ได้ในขณะนี้';
                break;
            case error.TIMEOUT:
                errorMsg = '❌ หมดเวลาในการรับตำแหน่ง';
                break;
            default:
                errorMsg = '❌ เกิดข้อผิดพลาดในการรับตำแหน่ง GPS';
        }
        this.showStatus(errorMsg, 'error');
    }

    updateMap(lat, lng) {
        // นำแผนที่ไปที่ตำแหน่งปัจจุบัน
        this.map.setView([lat, lng], 16);

        // ลบ marker เก่า
        if (this.marker) {
            this.map.removeLayer(this.marker);
        }

        // เพิ่ม marker ใหม่
        this.marker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).bindPopup(`<b>ตำแหน่งของคุณ</b><br>ละติจูด: ${lat.toFixed(6)}<br>ลองจิจูด: ${lng.toFixed(6)}`).addTo(this.map);

        this.marker.openPopup();
    }

    getTodayDate() {
        return new Date().toISOString().slice(0, 10);
    }

    // ==================== CHECK-IN / CHECK-OUT ====================

    async checkIn() {
        if (!this.validateForm()) {
            this.showStatus('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
            return;
        }

        if (!this.currentLocation) {
            this.showStatus('⚠️ กรุณารับตำแหน่ง GPS ก่อน', 'warning');
            return;
        }

        const employeeId = document.getElementById('employeeId').value;
        const employeeName = document.getElementById('employeeName').value;
        const department = document.getElementById('department').value;
        const attendanceDate = document.getElementById('attendanceDate').value || this.getTodayDate();
        const checkInTime = new Date();

        const record = {
            employeeId,
            employeeName,
            department,
            date: attendanceDate,
            type: 'CHECK_IN',
            time: checkInTime.toLocaleString('th-TH'),
            latitude: this.currentLocation.latitude,
            longitude: this.currentLocation.longitude,
            accuracy: this.currentLocation.accuracy
        };

        try {
            // ส่งข้อมูลไปที่ Backend
            await this.sendToBackend('/checkin', record);
            
            this.addToHistory(record);
            this.showStatus('✅ เข้างานสำเร็จ ' + checkInTime.toLocaleTimeString('th-TH'), 'success');
            this.checkInTime = checkInTime;
        } catch (error) {
            console.error('Error:', error);
            // เก็บไว้ใน localStorage ถ้าส่ง backend ไม่ได้
            this.addToHistory(record);
            this.showStatus('⚠️ บันทึกในอุปกรณ์ (ไม่ได้เชื่อมต่อ Server)', 'warning');
        }
    }

    async checkOut() {
        if (!this.validateForm()) {
            this.showStatus('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
            return;
        }

        if (!this.currentLocation) {
            this.showStatus('⚠️ กรุณารับตำแหน่ง GPS ก่อน', 'warning');
            return;
        }

        const employeeId = document.getElementById('employeeId').value;
        const employeeName = document.getElementById('employeeName').value;
        const department = document.getElementById('department').value;
        const attendanceDate = document.getElementById('attendanceDate').value || this.getTodayDate();
        const checkOutTime = new Date();

        const record = {
            employeeId,
            employeeName,
            department,
            date: attendanceDate,
            type: 'CHECK_OUT',
            time: checkOutTime.toLocaleString('th-TH'),
            latitude: this.currentLocation.latitude,
            longitude: this.currentLocation.longitude,
            accuracy: this.currentLocation.accuracy
        };

        try {
            // ส่งข้อมูลไปที่ Backend
            await this.sendToBackend('/checkout', record);
            
            this.addToHistory(record);
            this.showStatus('✅ ออกงานสำเร็จ ' + checkOutTime.toLocaleTimeString('th-TH'), 'success');
            this.checkOutTime = checkOutTime;
        } catch (error) {
            console.error('Error:', error);
            // เก็บไว้ใน localStorage ถ้าส่ง backend ไม่ได้
            this.addToHistory(record);
            this.showStatus('⚠️ บันทึกในอุปกรณ์ (ไม่ได้เชื่อมต่อ Server)', 'warning');
        }
    }

    // ==================== BACKEND COMMUNICATION ====================

    async sendToBackend(endpoint, data) {
        const response = await fetch(this.apiEndpoint + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // ==================== HISTORY MANAGEMENT ====================

    addToHistory(record) {
        this.attendanceHistory.push(record);
        this.saveHistory();
        this.displayHistory();
    }

    displayHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.attendanceHistory.length === 0) {
            historyList.innerHTML = '<p class="empty-message">ยังไม่มีประวัติการเช็คชื่อ</p>';
            return;
        }

        historyList.innerHTML = this.attendanceHistory
            .slice()
            .reverse()
            .map((item, index) => `
                <div class="history-item">
                    <div class="history-item-time">
                        ${item.time}
                    </div>
                    <div class="history-item-status ${item.type === 'CHECK_IN' ? 'checkin' : 'checkout'}">
                        ${item.type === 'CHECK_IN' ? '✅ เข้างาน' : '❌ ออกงาน'}
                    </div>
                    <div class="history-item-date">
                        📅 ${item.date || ''}
                    </div>
                    <div class="history-item-location">
                        📍 ${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}
                    </div>
                </div>
            `).join('');
    }

    saveHistory() {
        localStorage.setItem('attendanceHistory', JSON.stringify(this.attendanceHistory));
    }

    loadHistory() {
        const data = localStorage.getItem('attendanceHistory');
        return data ? JSON.parse(data) : [];
    }

    clearHistory() {
        if (confirm('คุณแน่ใจหรือที่จะล้างประวัติการเช็คชื่อทั้งหมด?')) {
            this.attendanceHistory = [];
            this.saveHistory();
            this.displayHistory();
            this.showStatus('✅ ล้างประวัติสำเร็จ', 'success');
        }
    }

    // ==================== FORM VALIDATION ====================

    validateForm() {
        const employeeId = document.getElementById('employeeId').value.trim();
        const employeeName = document.getElementById('employeeName').value.trim();
        const department = document.getElementById('department').value.trim();
        const attendanceDate = document.getElementById('attendanceDate').value.trim();

        return employeeId && employeeName && department && attendanceDate;
    }

    saveFormData() {
        const data = {
            employeeId: document.getElementById('employeeId').value,
            employeeName: document.getElementById('employeeName').value,
            department: document.getElementById('department').value,
            attendanceDate: document.getElementById('attendanceDate').value
        };
        localStorage.setItem('attendanceFormData', JSON.stringify(data));
    }

    restoreFormData() {
        const data = localStorage.getItem('attendanceFormData');
        if (data) {
            const { employeeId, employeeName, department, attendanceDate } = JSON.parse(data);
            document.getElementById('employeeId').value = employeeId || '';
            document.getElementById('employeeName').value = employeeName || '';
            document.getElementById('department').value = department || '';
            document.getElementById('attendanceDate').value = attendanceDate || this.getTodayDate();
        } else {
            document.getElementById('attendanceDate').value = this.getTodayDate();
        }
    }

    // ==================== UI FUNCTIONS ====================

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('statusMessage');
        statusElement.innerHTML = `<p>${message}</p>`;
        statusElement.className = `status-message ${type}`;

        // ลบ message หลังจาก 5 วินาที
        setTimeout(() => {
            statusElement.className = 'status-message';
            statusElement.innerHTML = '<p>พร้อมใช้งาน...</p>';
        }, 5000);
    }

    // ==================== EVENT LISTENERS ====================

    attachEventListeners() {
        // Get Location Button
        document.getElementById('getLocationBtn').addEventListener('click', () => this.getLocation());

        // Refresh Location Button
        document.getElementById('refreshLocationBtn').addEventListener('click', () => this.getLocation());

        // Check-in Button
        document.getElementById('checkInBtn').addEventListener('click', () => this.checkIn());

        // Check-out Button
        document.getElementById('checkOutBtn').addEventListener('click', () => this.checkOut());

        // Clear History Button
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());

        // Save form data when input changes
        ['employeeId', 'employeeName', 'department', 'attendanceDate'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.saveFormData());
        });

        // Auto-refresh location every 30 seconds
        setInterval(() => {
            if (this.currentLocation) {
                this.getLocation();
            }
        }, 30000);
    }
}

// ==================== INITIALIZE ON PAGE LOAD ====================

document.addEventListener('DOMContentLoaded', () => {
    const attendance = new AttendanceSystem();
    console.log('✅ Attendance System Initialized');
});
