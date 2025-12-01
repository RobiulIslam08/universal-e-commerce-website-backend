import { Response } from "express";
type TMeta = {
	limit:number,
	page:number,
	total:number,
	totalPage:number
}
type TResponse<T> = {
	statusCode:number,
	success:boolean,
	message:string,
	meta?: TMeta
	data:T
}
const sendResponse = <T>(res:Response,data:TResponse<T>) =>{
	res.status(200).json({
		statuscode:200,
		success:data.success,
		messsage:data.message,
		meta: data.meta,
		data:data.data

	})
}
export default sendResponse