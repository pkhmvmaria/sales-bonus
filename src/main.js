/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */

function calculateSimpleRevenue(amount, discountPercent) {
    const discount = 1 - (discountPercent / 100);
    return amount * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
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

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
if (!data
    || !Array.isArray(data.sellers)
    || data.sellers.length === 0
) {
    throw new Error('Некорректные входные данные');
}

if (typeof options !== "object"
     || options === null
     || typeof options.calculateSimpleRevenue !== "function" 
     || typeof options.calculateBonusByProfit !== "function" 
    ) {
    throw new Error('Чего-то не хватает');
}


      const { calculateSimpleRevenue, calculateBonusByProfit } = options; 

const sellerStats = data.sellers.map(seller => ({
   id: seller.id,
   first_name: seller.first_name,
   last_name: seller.last_name,
   start_date: seller.start_date,
   position: seller.position,
   revenue: 0, 
   profit: 0,
   sales_count: 0, 
   products_sold: {},
}));

const sellerIndex = Object.fromEntries(
    sellerStats.map(seller => [seller.id, seller])
);

const productIndex = Object.fromEntries(
    data.products.map(product => [product.sku, product])
);

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    // @TODO: Расчет выручки и прибыли для каждого продавца



data.purchase_records.forEach(record => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;
    
    let total_amount = 0;
    record.items.forEach(item => {
        const product = productIndex[item.sku];
        if (product) {
            const itemRevenue = calculateSimpleRevenue(
                product.sale_price * item.quantity, 
                record.discount
            );
            total_amount += itemRevenue;
        }
    });
    
    seller.sales_count += 1;
    seller.revenue += total_amount;
    
    record.items.forEach(item => {
        const product = productIndex[item.sku];
        if (!product) return;
        
        const cost = product.purchase_price * item.quantity;
        const revenue = calculateSimpleRevenue(product.sale_price * item.quantity, record.discount);
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
    seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);
    
    seller.top_products = Object.entries(seller.products_sold)
        .sort(([, quantityA], [, quantityB]) => quantityB - quantityA)
        .slice(0, 10)
        .map(([sku, quantity]) => ({ sku, quantity }));
});

return sellerStats;


}
