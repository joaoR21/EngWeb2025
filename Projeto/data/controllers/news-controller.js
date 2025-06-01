const News = require('../models/news');
const User = require('../models/user');

exports.createNews = async (newsData, authorId) => {
  try {
    const news_item = new News({
      ...newsData,
      author: authorId,
      publicationDate: newsData.publicationDate ? new Date(newsData.publicationDate) : new Date(),
      isVisible: newsData.isVisible !== undefined ? newsData.isVisible : false
    });
    await news_item.save();
    return news_item;
  } catch (error) {
    console.error("[ERROR] Creating news item:", error);
    throw error;
  }
};

exports.listAllNews = async (queryParams = {}) => {
  try {
    const news_items = await News.find(queryParams)
                                .populate('author', 'username')
                                .sort({ publicationDate: -1 });
    return news_items;
  } catch (error) {
    console.error("[ERROR] Listing all news items:", error);
    throw error;
  }
};

exports.listVisibleNews = async () => {
  try {
    const news_items = await News.find({ isVisible: true })
                                .populate('author', 'username')
                                .sort({ publicationDate: -1 });
    return news_items;
  } catch (error) {
    console.error("[ERROR] Listing visible news items:", error);
    throw error;
  }
};

exports.getNewsByID = async (newsID) => {
  try {
    const newsItem = await News.findById(newsID).populate('author', 'username');
    return newsItem;
  } catch (error) {
    console.error(`[ERROR]: finding news item ${newsID}:`, error);
    throw error;
  }
};


exports.updateNews = async (newsID, updateData) => {
  try {
    const news_item = await News.findByIdAndUpdate(newsID, { $set: updateData }, { new: true, runValidators: true })
                               .populate('author', 'username');
    return news_item;
  } catch (error) {
    console.error(`[ERROR]: updating news item ${newsID}:`, error);
    throw error;
  }
};

exports.deleteNews = async (newsID) => {
  try {
    const result = await News.findByIdAndDelete(newsID);
    if (!result) return null;
    return { message: 'News item deleted successfully.', deletedNewsId: newsID };
  } catch (error) {
    console.error(`[ERROR]: deleting news item ${newsID}:`, error);
    throw error;
  }
};

exports.toggleNewsVisibility = async (newsID) => {
  try {
    const news_item = await News.findById(newsID);
    if (!news_item) return null;
    news_item.isVisible = !news_item.isVisible;
    news_item.publicationDate = news_item.isVisible ? new Date() : news_item.publicationDate;
    await news_item.save();
    return news_item;
  } catch (error) {
    console.error(`[ERROR]: toggling visibility for news item ${newsID}:`, error);
    throw error;
  }
};