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
 * @returns {number} */

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
  return Number(num.toFixed(2));
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]} */
 
function analyzeSalesData({ sellers, products, purchase_records } = {}) {
    if (!sellers) throw new Error("Sellers array is required");
    if (!products) throw new Error("Products array is required");
    if (!purchase_records) throw new Error("Purchase records array is required");

    if (!Array.isArray(sellers) || !sellers.length) throw new Error("Sellers array is empty");
    if (!Array.isArray(products) || !products.length) throw new Error("Products array is empty");
    if (!Array.isArray(purchase_records)) throw new Error("Purchase records must be an array");

    // Создаём быстрый доступ к продуктам по SKU
   // Создаем карту продавцов по id для быстрого доступа
    const sellersMap = {};
    sellers.forEach(seller => {
        sellersMap[seller.id] = {
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0
        };
    });

    // Подсчет выручки и прибыли по продажам
    purchase_records.forEach(record => {
        const seller = sellersMap[record.seller_id];
        if (seller) {
            const recordRevenue = record.items.reduce(
                (sum, item) => sum + item.sale_price * item.quantity,
                0
            );
            seller.revenue += recordRevenue;
            // Прибыль = выручка - скидки
            const recordProfit = record.items.reduce(
                (sum, item) => sum + item.sale_price * item.quantity * (1 - item.discount / 100),
                0
            );
            seller.profit += recordProfit;
        }
    });

    // Формирование итогового массива продавцов с бонусами
    const result = Object.values(sellersMap).map(seller => {
        const bonus = calculateBonusByProfit(seller);
        return {
            ...seller,
            bonus
        };
    });

    return result;
}