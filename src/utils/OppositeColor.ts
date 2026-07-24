/**
 * Method to get inverse color from hex color value
 * @param  {String} oldColor String of hexadecimal color values（example：'#000000'）
 * @return {String} Return the inverse color value（example：'#ffffff'）
 */

const getOppositeColor = (oldColor: any) => {
  oldColor = '0x' + oldColor.replace(/#/g, '');
  let str = '000000' + (0xFFFFFF - oldColor).toString(16);
  return '#'+ str.substring(str.length - 6, str.length);
}

export default getOppositeColor;