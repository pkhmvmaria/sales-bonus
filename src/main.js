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

function analyzeSalesData({ sellers, products, purchase_records }, options = {}) {
  // Проверка обязательных данных
  if (!sellers || !products || !purchase_records) {
    throw new Error('Отсутствуют обязательные данные');
  }

  // Проверка формата данных
  if (!Array.isArray(sellers) || !Array.isArray(products) || !Array.isArray(purchase_records)) {
    throw new Error('Некорректный формат данных');
  }

  // Проверка на пустые массивы
  if (sellers.length === 0) throw new Error('Массив sellers пуст');
  if (products.length === 0) throw new Error('Массив products пуст');

  // Проверка корректности опций
  if (options && typeof options !== 'object') {
    throw new Error('Некорректные опции');
  }
  if ('calculateBonus' in options && typeof options.calculateBonus !== 'function') {
    throw new Error('calculateBonus должен быть функцией');
  }

  return sellers.map(seller => {
    const records = purchase_records.filter(r => r.seller_id === seller.id);

    const revenue = records.reduce((sum, record) => {
      const product = products.find(p => p.sku === record.sku);
      if (!product) return sum;
      return sum + product.sale_price * record.quantity;
    }, 0);

    const profit = records.reduce((sum, record) => {
      const product = products.find(p => p.sku === record.sku);
      if (!product) return sum;
      return sum + (product.sale_price - product.purchase_price) * record.quantity;
    }, 0);

    const bonus = options.calculateBonus ? options.calculateBonus(profit) : 0;

    const sales_count = records.reduce((sum, r) => sum + r.quantity, 0);

    const top_products = records
      .reduce((acc, r) => {
        const existing = acc.find(p => p.sku === r.sku);
        if (existing) existing.quantity += r.quantity;
        else acc.push({ sku: r.sku, quantity: r.quantity });
        return acc;
      }, [])
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      id: seller.id,
      first_name: seller.first_name,
      last_name: seller.last_name,
      position: seller.position,
      start_date: seller.start_date,
      revenue,
      profit,
      bonus,
      sales_count,
      top_products
    };
  });
}
