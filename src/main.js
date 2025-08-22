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
function analyzeSalesData(data, options = {}) {
  if (!data || typeof data !== 'object') throw new Error('Некорректные данные');
  const { sellers, products, purchase_records } = data;

  if (!Array.isArray(sellers) || sellers.length === 0) throw new Error('Нет продавцов');
  if (!Array.isArray(products) || products.length === 0) throw new Error('Нет продуктов');
  if (!Array.isArray(purchase_records) || purchase_records.length === 0) throw new Error('Нет записей о покупках');

  // Собираем данные по каждому продавцу
  const result = sellers.map(seller => {
    const sales = purchase_records.filter(r => r.seller_id === seller.seller_id);
    let revenue = 0;

    const productSalesMap = {};

    for (const sale of sales) {
      const product = products.find(p => p.product_id === sale.product_id);
      if (!product) continue;

      const saleRevenue = calculateSimpleRevenue(product, sale.quantity);
      revenue += saleRevenue;

      if (!productSalesMap[product.product_id]) productSalesMap[product.product_id] = 0;
      productSalesMap[product.product_id] += sale.quantity;
    }

    const profit = revenue * 0.085; // пример маржи
    const bonus = calculateBonusByProfit(profit);

    // Топ-продукты
    const top_products = Object.entries(productSalesMap)
      .map(([product_id, quantity]) => ({ product_id, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Только здесь округляем перед возвратом
    return {
      seller_id: seller.seller_id,
      name: seller.name,
      sales_count: sales.length,
      revenue: round2(revenue),
      profit: round2(profit),
      bonus: round2(bonus),
      top_products
    };
  });

  return result;
}

