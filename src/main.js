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
function analyzeSalesData({ sellers, products, purchase_records }) {
  if (!sellers || !products || !purchase_records) {
    throw new Error("Некорректные данные");
  }

  // Считаем выручку для каждого продавца
  const sellersWithRevenue = sellers.map(seller => {
    const sellerRecords = purchase_records.filter(r => r.seller_id === seller.id);

    const revenue = sellerRecords.reduce((sum, record) => {
      const product = products.find(p => p.id === record.product_id);
      if (!product) {
        throw new Error(`Product with id ${record.product_id} not found`);
      }
      return sum + calculateSimpleRevenue(record, product);
    }, 0);

    return {
      ...seller,
      revenue
    };
  });

  // Сортируем продавцов по выручке для расчета бонусов
  const sortedSellers = [...sellersWithRevenue].sort((a, b) => b.revenue - a.revenue);
  const totalSellers = sortedSellers.length;

  // Добавляем бонусы
  return sortedSellers.map((seller, index) => ({
    ...seller,
    bonus: calculateBonusByProfit(index, totalSellers, seller)
  }));
}
