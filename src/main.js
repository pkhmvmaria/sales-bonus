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
  // Проверка обязательных данных
  if (!data) throw new Error('Отсутствуют данные');
  const { sellers, products, purchase_records } = data;
  if (!sellers) throw new Error('Отсутствует sellers');
  if (!products) throw new Error('Отсутствует products');
  if (!purchase_records) throw new Error('Отсутствуют purchase_records');
  if (!Array.isArray(sellers) || sellers.length === 0) throw new Error('Пустой массив sellers');
  if (!Array.isArray(products) || products.length === 0) throw new Error('Пустой массив products');
  if (!Array.isArray(purchase_records) || purchase_records.length === 0) throw new Error('Пустой массив purchase_records');

  // Проверка опций
  if (!options || typeof options.calculateRevenue !== 'function' || typeof options.calculateBonus !== 'function') {
    throw new Error('Некорректные опции');
  }

  // Анализ по каждому продавцу
  return sellers.map(seller => {
    // Все записи продаж данного продавца
    const records = purchase_records.filter(r => r.seller_id === seller.id);

    // Вычисление выручки
    const revenue = options.calculateRevenue(records, products);

    // Вычисление прибыли
    const profit = records.reduce((sum, record) => {
      const product = products.find(p => p.sku === record.sku);
      if (!product) return sum;
      return sum + (product.sale_price - product.purchase_price) * record.quantity;
    }, 0);

    // Вычисление бонуса
    const bonus = options.calculateBonus({ ...seller, profit });

    // Топ-продукты по выручке
    const top_products = records
      .map(record => {
        const product = products.find(p => p.sku === record.sku);
        return product ? { ...product, revenue: product.sale_price * record.quantity } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    return { ...seller, revenue, profit, bonus, top_products };
  });
}
