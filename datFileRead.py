
from pynbt import NBTFile

# Load the .dat file
file_path = '/40abfe99-c27e-3c76-9e60-56f17a621a9b.dat'
nbt_file = NBTFile(file_path, 'rb')

# Print the contents in a readable format
print(nbt_file.pretty_tree())