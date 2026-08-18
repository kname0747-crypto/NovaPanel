$(document).ready(function () {
    $('#servicesPlatform').select2();
    $('#servicesCategory').select2();
});

function servicesRenderEmptyRow(text) {
    document.getElementById('servicesTableBody').innerHTML =
        `<tr><td colspan="7" style="text-align: center;">${text}</td></tr>`;
}

$('#servicesPlatform').on('select2:select', function (e) {
    let platform = this.value;
    let category = document.getElementById('servicesCategory');
    category.innerHTML = `<option value="0">Kategori Seçiniz</option>`;
    category.disabled = true;
    servicesRenderEmptyRow('Servisleri görmek için önce bir platform ve kategori seçiniz.');
    if (platform == 0) return;

    fetch('/api/v1/platforms/get/' + platform).then(res => res.json()).then(res => {
        if (res.status === '200') {
            category.innerHTML = '';
            if (res.data.length === 0) {
                category.innerHTML = `<option value="0">Kategori Bulunamadı</option>`;
                return;
            }
            res.data.forEach(element => {
                category.innerHTML += `<option value="${element.id}">${element.name}</option>`;
            });
            category.disabled = false;
        }
    });
});

$('#servicesCategory').on('select2:select', function (e) {
    let category = this.value;
    if (category == 0) return;
    servicesRenderEmptyRow('Yükleniyor...');

    fetch('/api/v1/services/get/' + category).then(res => res.json()).then(res => {
        if (res.status !== '200' || !res.data || res.data.length === 0 || res.data[0].id === 0) {
            servicesRenderEmptyRow('Bu kategoride servis bulunamadı.');
            return;
        }
        document.getElementById('servicesTableBody').innerHTML = res.data.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${s.min}</td>
                <td>${s.max}</td>
                <td>${s.price}</td>
                <td>${s.type}</td>
                <td>${s.refill ? 'Var' : '-'}</td>
            </tr>
        `).join('');
    });
});
