// main.js - Core Logic and Event Handling (Replaces script.js)

import { getPricesAndCalculateValues } from './js/priceFetcher.js'; // 🚨 路径更新
import { renderResults } from './js/render.js'; // 🚨 路径更新

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

        // 核心步骤 1: 调用 PriceFetcher 模块获取价格并计算价值
        const assetsWithValues = await getPricesAndCalculateValues(data.assets || []);
        
        // 核心步骤 2: 调用 Render 模块渲染结果
        renderResults(assetsWithValues, data.failed_protocols || []); 
        
        saveAddress(address); 

    } catch (e) {
        console.error("Fetch Error:", e);
        errorDisplay.textContent = `Query failed: ${e.message}`;
        errorDisplay.style.display = 'block';
    } finally {
        loadingIndicator.style.display = 'none';
        fetchButton.disabled = false;
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