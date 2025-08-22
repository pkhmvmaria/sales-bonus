/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { sale_price, quantity, discount } = purchase;
    
    if (!discount || discount === 0) {
        return sale_price * quantity;
    }
    
    const discountMultiplier = 1 - (discount / 100);
    return sale_price * quantity * discountMultiplier;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
}

function calculateRevenue(purchase, _product) {
    return calculateSimpleRevenue(purchase, _product);
}

function calculateBonus(index, total, seller) {
    return calculateBonusByProfit(index, total, seller);
}

/**
 * Функция для округления чисел до 2 знаков после запятой
 * @param {number} num
 * @returns {number}
 */
function round2(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Некорректные входные данные');
    }

    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('Некорректные входные данные');
    }
    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные');
    }

    if (typeof options !== "object" || options === null ||
        typeof options.calculateRevenue !== "function" || 
        typeof options.calculateBonus !== "function") {
        throw new Error('Чего-то не хватает');
    }

    const { calculateRevenue, calculateBonus } = options; 

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        first_name: seller.first_name,
        last_name: seller.last_name,
        revenue: 0, 
        profit: 0,
        sales_count: 0, 
        products_sold: {}
    }));

    const sellerIndex = Object.fromEntries(
        sellerStats.map(seller => [seller.id, seller])
    );

    const productIndex = Object.fromEntries(
        data.products.map(product => [product.sku, product])
    );

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;
        
        let total_amount = 0;
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (product) {
                const itemRevenue = calculateRevenue(item, product);
                total_amount += itemRevenue;
            }
        });
        
        seller.sales_count += 1;
        seller.revenue += total_amount;
        
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;
        
            const revenue = calculateRevenue(item, product); 
            const cost = product.purchase_price * item.quantity;
            const itemProfit = revenue - cost;
            
            seller.profit += itemProfit;
            
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        
        seller.top_products = Object.entries(seller.products_sold)
            .sort(([, quantityA], [, quantityB]) => quantityB - quantityA)
            .slice(0, 10)
            .map(([sku, quantity]) => ({ sku, quantity }));
    });

    // Трансформация в ожидаемый формат
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: round2(seller.revenue),
        profit: round2(seller.profit),
        sales_count: seller.sales_count,
        bonus: round2(seller.bonus),
        top_products: seller.top_products
    }));
}
