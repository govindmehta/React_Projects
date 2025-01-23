import mongoose from "mongoose"
mongoose.connect("mongodb+srv://govind:govind@cluster0.2s8xo.mongodb.net/todolist")

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
    tasks: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ], 
})


const User = mongoose.model("User",UserSchema)

export {User}
