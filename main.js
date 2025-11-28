// main.js - 修复地址切换问题的完整文件

import { getPricesAndCalculateValues } from './js/priceFetcher.js'; 
import { renderResults } from './js/render.js'; 

const API_ENDPOINT = "/api/asset-tracker";

const addressInput = document.getElementById('addressInput');
const fetchButton = document.getElementById('fetchButton');
const loadingIndicator = document.getElementById('loading');
const errorDisplay = document.getElementById('error');
const addressDatalist = document.getElementById('addressHistory'); 
const clearHistoryButton = document.getElementById('clearHistoryButton'); 


// -------------------- Address History (localStorage) Logic --------------------
const STORAGE_KEY = 'queriedAddresses';
const MAX_HISTORY_COUNT = 10;

function getSavedAddresses() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load addresses from localStorage:", e);
        return [];
    }
}

function saveAddress(address) {
    let addresses = getSavedAddresses();
    addresses = addresses.filter(addr => addr.toLowerCase() !== address.toLowerCase());
    addresses.unshift(address);
    addresses = addresses.slice(0, MAX_HISTORY_COUNT);
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
        updateDatalist(addresses);
    } catch (e) {
        console.error("Failed to save address to localStorage:", e);
    }
}

function updateDatalist(addresses) {
    if (!addressDatalist) return;
    
    addressDatalist.innerHTML = addresses.map(addr => 
        `<option value="${addr}"></option>`
    ).join('');
    
    clearHistoryButton.style.display = addresses.length > 0 ? 'block' : 'none';
}

function clearAddressHistory() {
    if (confirm('Are you sure you want to clear all query history?')) {
        localStorage.removeItem(STORAGE_KEY);
        updateDatalist([]);
    }
}

// -------------------- Main Logic and Event Handling --------------------

async function fetchAssets() {
    const address = addressInput.value.trim();
    
    document.getElementById('resultsContainer').innerHTML = ''; // 清空结果容器
    errorDisplay.style.display = 'none';
    loadingIndicator.style.display = 'block';
    fetchButton.disabled = true;

    if (!address) {
        errorDisplay.textContent = 'Please enter an address.';
        errorDisplay.style.display = 'block';
        loadingIndicator.style.display = 'none';
        fetchButton.disabled = false;
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}?address=${address}`);
        const data = await response.json();
        
        if (response.status !== 200 || data.error) {
            throw new Error(data.details || data.error || 'The server returned an error.');
        }

        const { assets: assetsWithValues, totalUsdValue } = await getPricesAndCalculateValues(data.assets || []);
        
        renderResults(assetsWithValues, data.failed_protocols || [], totalUsdValue, address);
        
        // 1. 保存地址到历史记录 (这会更新 datalist)
        saveAddress(address); 

        // 2. 🚀 核心修复：查询成功后清空输入框。
        // 清空输入框后，下次点击时，由于输入为空，浏览器会显示 datalist 中的所有选项。
        addressInput.value = '';

    } catch (e) {
        console.error("Fetch Error:", e);
        errorDisplay.textContent = `Query failed: ${e.message}`;
        errorDisplay.style.display = 'block';
    } finally {
        loadingIndicator.style.display = 'none';
        fetchButton.disabled = false;
        
        // 确保输入框聚焦，方便用户继续操作
        addressInput.focus();
    }
}

/**
 * Page initialization function
 */
function init() {
    const saved = getSavedAddresses();
    updateDatalist(saved);
    // Bind events
    clearHistoryButton.addEventListener('click', clearAddressHistory);
    fetchButton.addEventListener('click', fetchAssets);
    addressInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchAssets();
        }
    });
}

// Ensure initialization logic runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);