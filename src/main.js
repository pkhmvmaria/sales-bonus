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
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
  if (!options || typeof options.calculateRevenue !== 'function' || typeof options.calculateBonus !== 'function') {
    throw new Error('Некорректные опции');
  }

  if (!data) throw new Error('Нет данных');
  const { sellers, products, purchase_records } = data;

  if (!Array.isArray(sellers) || !Array.isArray(products) || !Array.isArray(purchase_records)) {
    throw new Error('Некорректные данные');
  }
  if (!sellers.length) throw new Error('Нет продавцов');
  if (!products.length) throw new Error('Нет продуктов');
  if (!purchase_records.length) throw new Error('Нет записей о покупках');

  const result = sellers.map(seller => {
    const sales = purchase_records.filter(rec => rec.seller_id === seller.id);

    const revenue = options.calculateRevenue(sales, products);
    const profit = sales.reduce((sum, rec) => {
      const product = products.find(p => p.sku === rec.sku);
      return sum + (product.price - product.cost) * rec.quantity;
    }, 0);
    const bonus = options.calculateBonus(profit);

    // Топ 5 продуктов по количеству продаж
    const top_products = sales.reduce((acc, rec) => {
      const existing = acc.find(p => p.sku === rec.sku);
      if (existing) {
        existing.quantity += rec.quantity;
      } else {
        acc.push({ sku: rec.sku, quantity: rec.quantity });
      }
      return acc;
    }, []).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    return {
      seller_id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      revenue,
      profit,
      bonus,
      sales_count: sales.length,
      top_products
    };
  });

  return result;
}
