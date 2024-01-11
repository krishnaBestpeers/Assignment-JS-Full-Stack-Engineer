const { v4: generateId } = require('uuid');
const database = require('./database');

function requestLogger(req, res, next) {
    res.once('finish', () => {
        const log = [req.method, req.path];
        if (req.body && Object.keys(req.body).length > 0) {
            log.push(JSON.stringify(req.body));
        }
        if (req.query && Object.keys(req.query).length > 0) {
            log.push(JSON.stringify(req.query));
        }
        log.push('->', res.statusCode);
        // eslint-disable-next-line no-console
        console.log(log.join(' '));
    });
    next();
}

async function getAllTodos(req, res) {
    try {
        let query = {};
        let skip = req.query.skip ? parseInt(req.query.skip) : 0;

        if (req.query.dueDate) {
            const isoDate = new Date(req.query.dueDate).toISOString();
            query.dueDate = isoDate.split('T')[0];
        }

        const todos = await database.client.db('todos').collection('todos')
            .find(query)
            .sort({ index: 1 })
            .skip(skip)
            .limit(20)
            .toArray();
        // Send the response after querying with dueDate
        res.status(200).json(todos);
    } catch (error) {
        console.error("Error fetching todos:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

async function createTodo(req, res) {
    try {
        const { text, dueDate } = req.body;

        if (typeof text !== 'string') {
            res.status(400);
            res.json({ message: "invalid 'text' expected string" });
            return;
        }
        const collection = database.client.db('todos').collection('todos');
        const maxIndexTodo = await collection
            .find({}, { sort: { index: -1 }, limit: 1 })
            .toArray();

        const newIndex = maxIndexTodo.length > 0 ? maxIndexTodo[0].index + 1 : 1;

        const todo = { id: generateId(), text, completed: false, dueDate, index: newIndex };
        await collection.insertOne(todo);
        res.status(201);
        res.json(todo);
    } catch (error) {
        console.error('Error handling POST request:', error);
        res.status(500);
        res.json({ message: 'Internal server error' });
    }
}

async function updateDraggedTodoPosition(req, res) {

    const { draggedId, draggedIndex, droppedId, droppedIndex } = req.body;
    const collection = database.client.db('todos').collection('todos');

    try {
        // Remove the dragged todo from its current position
        await collection.updateOne({ id: draggedId }, { $set: { index: -1 } });
        await collection.find({}).toArray();

        // Shift other todos to make space for the dragged todo
        if (draggedIndex < droppedIndex) {
            await collection.updateMany(
                { index: { $gte: droppedIndex + 1 } },
                { $inc: { index: 1 } }
            );
            await collection.updateOne({ id: draggedId }, { $set: { index: droppedIndex + 1 } });
        } else {
            await collection.updateMany(
                { index: { $gte: droppedIndex } },
                { $inc: { index: 1 } }
            );
            await collection.updateOne({ id: draggedId }, { $set: { index: droppedIndex } });
        }
        const sortedTodos = await collection.find({}).sort({ index: 1 }).toArray();

        res.status(200).json({ message: "Todo order updated successfully", sortedTodos: sortedTodos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

async function updateTodoById(req, res) {
    const { id } = req.params;
    const { completed } = req.body;
    if (typeof completed !== 'boolean') {
        res.status(400);
        res.json({ message: "invalid 'completed' expected boolean" });
        return;
    }

    try {
        await database.client.db('todos').collection('todos').updateOne(
            { id },
            { $set: { completed: completed } },
        );

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
        return;
    }
    res.status(200);
    res.end();
}

async function deleteTodoById(req, res) {
    try {
        const { id } = req.params;
        const collection = database.client.db('todos').collection('todos');

        // Find the todo to be deleted
        const todoToDelete = await collection.findOne({ id: id });
        if (!todoToDelete) {
            res.status(404);
            res.json({ message: "Todo not found" });
            return;
        }
        await collection.deleteOne({ id: id });

        res.status(203);
        res.end();
    } catch (error) {
        console.error('Error handling DELETE request:', error);
        res.status(500);
        res.json({ message: 'Internal server error' });
    }
}

module.exports = {
    requestLogger,
    getAllTodos,
    createTodo,
    updateDraggedTodoPosition,
    updateTodoById,
    deleteTodoById,
};
