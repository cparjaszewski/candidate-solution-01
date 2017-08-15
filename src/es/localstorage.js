"use strict";
export { save, get, remove };

function save(what = "", data = "")
{
	if(check())
	{
		localStorage.setItem(what, data);
	}
}

function get(what = "")
{
	if(check())
	{
		return localStorage.getItem(what);
	}
	return false;
}

function remove(what = '')
{
	if(check())
	{
		localStorage.removeItem(what);
	}
}

function check() {
	let result = false;
	if (typeof(Storage) !== "undefined")
	{
	    result = true;
	}
	else
	{
		console.log("Your browser no support localstorage");
	}
	return result;
}