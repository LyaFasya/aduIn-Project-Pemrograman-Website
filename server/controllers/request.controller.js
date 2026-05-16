const {Form} = require('../models');

const createRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, location, category_id} = req.body;

        const newRequest = await Form.create({
            user_id: userId,
            title,
            description,
            location,
            category_id,
            label: 'request',
            status: 'pending'
        });

        res.status(201).json({message: 'request berhasil dibuat', data: newRequest});
    }catch (error){
        res.status(500).json({message: 'request tidak berhasil dibuat', data: error.message});
    }
}