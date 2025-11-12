function bytesToGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

function updateBadge() {
  if (!chrome.system || !chrome.system.memory) return;

  chrome.system.memory.getInfo((info) => {
    const freeRatio = (info.availableCapacity / info.capacity) * 100;
    let text = "";
    let color = [0, 0, 0, 0]; // default: transparent

    if (freeRatio < 10) {
      text = Math.round(freeRatio) + "%";
      color = [220, 53, 69, 255]; // kırmızı (alert-danger)
    } else if (freeRatio < 25) {
      text = Math.round(freeRatio) + "%";
      color = [255, 193, 7, 255]; // sarı (alert-warning)
    }
    else{
        text = Math.round(freeRatio) + "%";
      color = [40, 167, 69, 255]; // sarı (alert-warning)   
    }

    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color });
  });
}

// Başlangıçta çalıştır
updateBadge();

// Her 5 saniyede bir güncelle
setInterval(updateBadge, 5000);

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url.startsWith("chrome://")) {
        const now = Date.now();
        chrome.storage.local.get("tabsLastVisit", (data) => {
            const tabsLastVisit = data.tabsLastVisit || {};
            tabsLastVisit[tab.id] = now;
            chrome.storage.local.set({ tabsLastVisit });
        });
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.local.get("tabsLastVisit", (data) => {
        const tabsLastVisit = data.tabsLastVisit || {};
        delete tabsLastVisit[tabId];
        chrome.storage.local.set({ tabsLastVisit });
    });
	  chrome.runtime.sendMessage({ action: "tabClosed" });
});


