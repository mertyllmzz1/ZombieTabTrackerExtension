async function loadTabs() {
	let totalGB; let availableGB;
	chrome.storage.local.get("tabsLastVisit", async (data) => {
		const tabsLastVisit = data.tabsLastVisit || {};
		const tabsArray = [];

		for (const tabId in tabsLastVisit) {
			const tab = await chrome.tabs.get(Number(tabId)).catch(() => null);
			if (tab) {
				tabsArray.push({
					id: tab.id,
					title: tab.title,
					url: tab.url,
					lastVisit: tabsLastVisit[tabId]

				});
			}
		}
		// En uzun süre girilmeyenleri sırala
		tabsArray.sort((a, b) => a.lastVisit - b.lastVisit);

		const ul = document.getElementById("tabList");
		ul.innerHTML = ""; // Önce temizle

		tabsArray.forEach(tab => {

			const titleSpan = document.createElement("span");

			const li = document.createElement("li");
			const minutesAgo = Math.floor((Date.now() - tab.lastVisit) / 60000);
			const hour = Math.floor(minutesAgo / 60);
			const min = minutesAgo % 60
			li.className = "list-group-item d-flex justify-content-between align-items-center";

			const btnClose = document.createElement("button");
			btnClose.textContent = "Sekmeyi kapat";
			btnClose.className = "btn btn-danger btn-md btn-flex";
			btnClose.addEventListener('click', () => {

				const beforeTabClose = availableGB;
				chrome.tabs.remove(tab.id);

				const afterTabClose = availableGB;

			});
			const btnFocus = document.createElement("button");
			btnFocus.textContent = "Sekmeye git";
			btnFocus.className = "btn btn-success btn-md btn-flex";
			btnFocus.addEventListener('click', () => {
				chrome.tabs.update(tab.id, { active: true });        // Sekmeyi aktif yap
				//chrome.windows.update(tab.windowId, { focused: true })
			}
			);


			titleSpan.textContent = `${tab.title.substring(0, 50)} (${hour} saat ${min} dk önce ziyaret edildi. )`;
			titleSpan.style.wordBreak = "break-word"; // Gerekli, satır kırma

			li.appendChild(titleSpan);
			li.appendChild(btnFocus);
			li.appendChild(btnClose)
			ul.appendChild(li);

		})

	})
	document.addEventListener("DOMContentLoaded", () => {
		updateMemoryInfo();

		chrome.tabs.onRemoved.addListener(() => {
   		 setTimeout(updateMemoryInfo, 1000);
  });
	});
}
loadTabs();
chrome.runtime.onMessage.addListener((msg) => {
	
	if (msg.action === "tabClosed") {
		loadTabs();
	}
});

function updateMemoryInfo() {
	chrome.system.memory.getInfo((info) => {
		const totalGB = bytesToGB(info.capacity);
		const availGB = bytesToGB(info.availableCapacity);

		document.getElementById("totalRam").textContent = `${totalGB} GB`;
		document.getElementById("freeRam").textContent = `${availGB} GB`;

		const ramAlert = document.getElementById("ramAlert");
		const freeRatio = (info.availableCapacity / info.capacity) * 100;

		if (freeRatio < 10) {
			ramAlert.textContent = `⚠️ Sistem belleği kritik seviyede (%${freeRatio.toFixed(1)} boş). Kullanılmayan sekmeleri kapat!`;
			ramAlert.classList.add("alert-danger");
			ramAlert.classList.remove("d-none","alert-warning");
		} else if (freeRatio < 25) {
			ramAlert.textContent = `⚠️ Bellek düşük (%${freeRatio.toFixed(1)} boş). Sekme temizliği önerilir.`;
			ramAlert.classList.add("alert-warning");
			ramAlert.classList.remove("d-none","alert-danger");
		} else {
			ramAlert.classList.remove("alert-danger","alert-danger");
			ramAlert.classList.add("d-none");
		}
		updateRamUsage(freeRatio)
	});
}
function bytesToGB(bytes) {
	return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

function updateRamUsage(freeRatio) {
    document.getElementById("ram-bar").style.width = 100-freeRatio + "%";
}